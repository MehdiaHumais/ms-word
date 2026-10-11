//! BritDocs desktop shell (Tauri 2).
//!
//! The heavy lifting is the React frontend; this shell only adds native file
//! dialogs, filesystem access and the `.britdoc` launch handling so a
//! double-clicked document opens in the app (TDR-008: native capabilities
//! through IPC, never raw web APIs).

use std::sync::Mutex;
use serde::Serialize;
use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager, State};

/// Payload forwarded to the frontend when a `.britdoc` file is opened
/// (a second app instance was launched with a document).
#[derive(Clone, Serialize)]
struct OpenPathPayload {
    path: String,
}

/// Path the app was launched with, so the frontend can claim it after the
/// webview boots (a plain event would be emitted before any listener exists).
struct PendingOpen(Mutex<Option<String>>);

const OPEN_FILE_EVENT: &str = "britdocs://open-file";
const OPEN_FILE_EVENT2: &str = "britdocs://open-file2";
const OPEN_PATH_PAYLOAD: &str = "britdocs://open-path";
const OPEN_PATH_EVENT: &str = "britdocs://open-path-event";
const OPEN_PATH_EMIT: &str = "britdocs://open-path-emit";

/// Emitted when a File menu item (or its accelerator) is activated. The
/// frontend owns all document logic, so the shell only forwards the intent.
const MENU_ACTION_EVENT: &str = "britdocs://menu-action";

/// Build the native File menu.
///
/// This is not decoration: WebView2 consumes several well-known accelerators
/// (notably `Ctrl+S`) before the page sees a `keydown`, so a frontend-only
/// shortcut silently does nothing. Registering the accelerator on a native menu
/// item makes Windows deliver the key to the app, and we forward the intent to
/// the frontend where the real save/open/new logic already lives.
fn build_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let new = MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?;
    let open = MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?;
    let save = MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?;
    let save_as =
        MenuItem::with_id(app, "save-as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("Exit"))?;

    // `Submenu::with_items` takes a slice of trait objects, not one concrete type.
    let items: Vec<&dyn IsMenuItem<tauri::Wry>> =
        vec![&new, &open, &sep1, &save, &save_as, &sep2, &quit];
    let file = Submenu::with_items(app, "File", true, &items)?;
    Menu::with_items(app, &[&file])
}

/// First non-switch command-line argument. Rust's `env::args()` includes the
/// executable path as argv[0], so user args start at index 1.
fn first_file_arg(args: &[String]) -> Option<String> {
    args.iter().skip(1).find(|a| !a.starts_with('-')).cloned()
}

/// Emit the given path to a running frontend (second app instance case).
fn emit_open(path: &str, app: &tauri::AppHandle) {
    let _ = app.emit(OPEN_FILE_EVENT, OpenPathPayload { path: path.to_string() });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(p) = first_file_arg(&args) {
                emit_open(&p, app);
            }
        }))
        .manage(PendingOpen(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_pending_file, clear_pending_file])
        .on_menu_event(|app, event| {
            let _ = app.emit(MENU_ACTION_EVENT, event.id().0.as_str());
        })
        .setup(|app| {
            // First launch with a file on the command line (double-clicked doc).
            let args: Vec<String> = std::env::args().collect();
            eprintln!("[setup] argv={args:?}");
            if let Some(p) = first_file_arg(&args) {
                eprintln!("[setup] detected file arg {p}");
                if let Some(pending) = app.try_state::<PendingOpen>() {
                    *pending.0.lock().unwrap() = Some(p);
                }
            } else {
                eprintln!("[setup] no file arg");
            }
            eprintln!("[setup] pending now claimed");

            // Native File menu so Ctrl+S / Ctrl+O / Ctrl+N are delivered to the
            // app instead of being swallowed by the webview.
            match build_menu(app.handle()) {
                Ok(menu) => {
                    app.set_menu(menu)?;
                }
                Err(e) => eprintln!("[setup] menu unavailable: {e}"),
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running britdocs");
}

/// Peek at the launch-time file path. This does **not** consume it: React
/// StrictMode double-mounts effects and Tiptap may recreate the editor, so the
/// frontend can legitimately ask more than once. It calls
/// `clear_pending_file` once the document has actually been loaded.
#[tauri::command]
fn get_pending_file(state: State<PendingOpen>) -> Option<String> {
    let result = state.0.lock().unwrap().clone();
    eprintln!("[get_pending_file] -> {result:?}");
    result
}

/// Consume the pending path after a successful open so it is not re-opened.
#[tauri::command]
fn clear_pending_file(state: State<PendingOpen>) {
    let _ = state.0.lock().unwrap().take();
    eprintln!("[clear_pending_file]");
}
