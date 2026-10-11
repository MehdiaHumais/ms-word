import type { Node } from "@tiptap/pm/model";

/* ================= Spelling dictionary ================= */

const BASE_WORDS = `
a about above accept according across act actually add after again against age ago agree ahead air
all allow almost alone along already also although always among amount and another answer any anyone
anything appear area around arrive art as ask at away back bad ball bank bar base be bear beat because
become been before begin behind believe below best better between beyond big bill bird bit black block
blood blue board boat body book both bottle bottom box boy break bring brother bring brown build built
business but buy by call came camp can cannot car care carry case catch cause cell certain chair chance
change check child children choose church city class clear climb close cloud club coast cold collect
color come common company complete consider contain continue control cook cool copy corner cost could
count country couple course cover create cross crowd cry current cut dark data date day dead deal dear
decide deep department develop die difference different difficult dinner direction do doctor dog dollar
done door down draw dream drive drop during each early earth east easy eat edge education effect eight
either else end energy enough enter entire even evening event ever every everyone everything exactly
example except expect explain eye face fact fall family far farm fast father feel feet fell felt few
field fight figure fill final find fine finger finish fire firm first fish fit five floor fly follow
food foot for force form forward found four free fresh friend front full fun game garden gas general
get girl give glass go god gold gone good government great green ground group grow guess gun guy hair
half hand happen happy hard has have he head health hear heard heart heat heavy help her here herself
hey high him himself his history hit hold home hope horse hospital hot hotel hour house however huge
human hundred husband idea if imagine important in include including increase indeed inside instead
interest into is its itself job join just keep kept key kid kill kind king kitchen know land language
large last late later laugh law lay lead learn least leave left leg less lesson let letter level lie
life light like line list listen little live local long look lose lot love low machine main major
make man many map mark market matter may maybe me mean measure meet member men method middle might mile
milk million mind minute miss money month more morning most mother move movie much music must my myself
name nation natural near need never new news next nice night nine no nor north nose not note nothing
notice now number object occur of off offer office often oh oil ok old on once one only open operate
or order other our out outside over own page pain paper parent part party pass past pay peace people
per perhaps period person picture piece place plan plant play point poor position possible power
practice present press pretty probably problem process produce product program public pull purpose put
question quick quiet quite radio rain raise rather reach read ready real reason receive record red
remember repeat report rest result return rich right ring rise road rock roll room round rule run
sad safe said same save say school science sea second see seem self sell send sense sentence serve set
seven several shall shape share she shoulder should show side sign simple since sing sister sit site six
size sleep slight slow small smile so social some something sometimes son song soon sorry sort sound south
space speak special specific speech spend sport spring staff stage stand standard star start state stay
step still stock stop story straight street strong student study stuff style such sudden summer sun
support sure system table take talk tax teach team tell ten term test than thank that the their them
themselves then there these they thing think third this those though thought thousands three through
throw thus time to today together told too took top total touch toward town track trade train travel
tree trip trouble true try turn two type under understand unit until up upon us use usually value
various very view visit voice wait walk wall want war warm was wash watch water way we weak wear weather
week well went were west what whatever when where whether which while white who whole whom whose why wide
wife will win wind window wish with within without woman wonder word work world worry would write wrong
year yellow yes yet you young your yourself
`;

const EXTRA_WORDS = `
ability able absent absolute academic access accident achieve act action active activity actor actual
addition administration advantage advice advocate affairs affect afford afternoon agenda agency agent
agreement aircraft airline album alcohol alliance alternative analysis analyst ancient angle anger
animal anniversary annual answer anxiety anxious apology appeal appear appearance applicant application
apply appoint appreciation approach appropriate approval approve approve approximately architecture
argument arise armed arrest article artist artistic artwork aside assault assign assignment assist
assistance associate association assumption atmosphere attach attack attempt attempt attention attitude
attorney attract attribute audience author authority automatic availability available average aviation
award aware awful awkward baby background backyard bacteria badge bag balance band barely barrier base
basic basically battery battle beach bean bear beauty behavior behavioral behind belief bell belong
belt bench bend benefit besides bicycle biological bird birthday bite blame blanket blend blessing blind
born bother bother bounce boundary bowl brain branch brand breast breath breathe breathing brief briefly
bright brilliant broadcast broaden broken browser budget bunny burden burn buried button buy cabinet
cable calculate calculation call calm campaign candidate capable capacity capital capture carbon career
careful carefully cast casual category celebrate celebration cell central centre century ceremony certainly
chair challenge chamber champion characteristic characteristic charge charitable charity charm chart chase
chicken chief chip chocolate choice cigarette circuit circumstance citizen civil claim clan classic
classical classroom clause clean climate climb closely clothing coal coast collide combat combination
combine comfort comfortable command comment commercial commission commitment commit committee common
commonly community commute comparable compare comparison compete competition competitive competitor
complain complaint complete completely complex complexity component comprehend comprehension concept
concern concerning concert conclude conclusion concrete condition conduct conference confidence confident
confirm conflict confront confrontation confuse confusion congress conscience conscious consciousness
consequence conservation conservative consider considerable consideration consist consistent constantly
constitute constitutional construct construction consume consumption contact container contemporary
contest context continent contract contrast contribute contribution control controversial controversy
contribute convenient convention conventional conversation conviction convince cooperation coordinate
copy core corner corporation correction correspond correspondence cost costly cottage cotton couple
courage course court cousin coverage crawl creative creativity credential credit crime criminal crisis
criteria criterion critical criticism criticize criticize crowd crucial crude cruise cue cult culture
curious current curriculum curious currency curtain curve cushioned custom cut cycle daily dairy damage
dance dangerous dare dark darken darkness darken database deal debate debt decade decisión decision deck
declare decline decrease deeply defeat defense defensive define definition delicious delicious deliver
delivery demand democracy democratic demonstration dentist deny department departure depend dependent
deposit depression depth deputy derive describe description desert deserve design designer desire desk
destroy destruction detail detect detective development device devote dialogue diamond diary diet differ
digit digital dimension dinner directly director dirt disadvantage disappoint disappointed discipline
discount discover discovery discretion discussion disease disgrace dish disk dismiss display dispute
distance distant distinct distinction distribute distribution district disturb diverse diversity divide
division divorce document domestic dominant donate door dot double doubt downtown draft drag dramatic
dramatically draw drawer dread dream dress drill drink drive drum drunk due dull dumb during dust duty
dynasty earlier earn earning economic economy edge educate edition editor editorial educate effective
effectively efficient effort elaborate elder elect election electric electrical electricity electronic
elegant element elementary eliminate elite emerge emergency emotion emotional emphasis emphasize employ
employee employer employment employee enable encounter encourage encouragement encourage endless enemy
energy enforce engagement engine engineer engineering enhance enormous enough ensure enterprise entertain
entertainment enthusiasm enthusiastic entire entirely entirely entrance envelope environment environmental
epidemic equal equally equipment era erase escape especially essay establish estate estimate ethnic evaluate
evaluation event eventually everybody everyday everyone evidence evident evil evolution evolve exact
exactly examination examine excellent exception exchange excite excited excitement exclude executive
exhibit exhibition exist existence existing expand expansion expect expectation expensive experience
experiment expert expertise explain explanation explicit explore explosion export expose exposure express
expression extend extension extensive extent external extra extraordinary extreme fact factor factory
faculty fail failure fair fairly faith familiar family fancy fantastic fantastic fare farmer farming
fascinating fashion fasten fatal fate fault favorable feature federal fee feedback fellow female feminist
fertile festival fever fiction field fierce figure file film filter final finally finance financial
finding finger finite fix flag flame flash flat flavor flee flesh flight float flood floor folder folk
folk footage forbid forbidden force forecast forever formal format formation former formula forth fortune
forum forward fossil foster foundation founder frankly fraud frequency frequent fresh friendly friendship
frontier fuel fulfill full function fundamental funding funeral funny furniture further gain gallery gap
garage garden gather gathering gaze gear gene generate generation generous gentle gentleman genuine
genuine geographic geography gesture giant gifted glance global glory glow goal golf grab grace graduate
grain grand grant grass grateful gravestone gray grease great increasingly greet grin grip gross ground
growing guarantee guard guidance guideline guilty habit hall handful handle handy hang harbor harmony
harvesthate headline heal healthcare heap hearing heart heavy hedge height hello helpful hence hero
hidden highlight highly hike hire historical honest honesty hook hop horizon horror horse host hostile
household housing huge human humble humor humorous hunt hunter husband hypothesize ice icon ideal
identity ideology ignorance ignore illegal illness illusion illustrate illustration image imaginary
imagination imagine immediate immigrant immigration immune impact implement implication imply import
importance impose impress impressive improvement include income incredible indeed independence independent
index indication individual indoor industrial industry inevitable infant infant infection influence
informal information ingredient initial initiative injure injury innocent inquiry insight inspect inspire
inspiration install instance instant instead institute institution institutional instruction instrument
insure intellectual intelligence intense intention interactive interior internal international internet
interpret interpretation interval interview introduce introduction invade invasion invest investigate
investigation investment investor invite invoice involve ironically issue item jail jeans jewel job
joint journal journalist journey judge judgment juice jump junior jury justice justify keen keep kettle
kick kid kill kind knee knife knock knowledge labor laboratory lack landscape lawyer lay layer lazy
league leak lean leap legal legend legislation legislative leisure lemon lend length lesson liberal liberate
liberty license lid lift likelihood likely limb limit link lip liquid list literally literature load loan
lobby local locate location logic logical login lonely loose lose loss loud lounge loyalty luck lucky
lunch lung machine magic mail main maintain maintain majority makee male mall mankind manual manufacture
manufacturer mapping margin marine market marketing marriage married marry mask massive master match
material math matter mature maximum mayor meantime measurement meat mechanic mechanism media medical
medicine medium membership memo memory mental mention menu merchant mercy mere merely merit mess message
metal metaphor method methodology mile military miner mineral minister ministry minor minority minute
miracle mirror missile mission mistake mix mixture mobile mode modern modest modification modify moment
monitor month mood moral morality moreover mostly motion motivate motivation motive motor mechanism mount
mountain mouse move movement multiple multiply murder muscle museum mushroom musical musician mutual
mystery myth naive naked narrative narrow nasty nation national naturally nature naval nearby neat
necessarily necessary necessity neglect negotiation neighbor neighborhood neighbor nervous net network
neutral nevertheless noteworthy notorious novel nowhere numerous nurse nursery nut objective obligation
oblige observe observation observe obsession obstacle obtain obvious occasion occasionally occupation
occupy occur official offset offspring olive omit ongoing onto opening opera operate operational operator
opponent opportunity opposite opposition opt optimize oral orange orbit orchestra ordinary organic
organize organization organized organize origin original originally outcome outdoor outfit outside
outstanding overall overcome overlook overnight overlap overseas overview owe own owner ownership pace
pack package packet pad page painful paint painter painting palm panel panic paragraph parallel
parameter parcel parent parking parliament participant participate participation particular particularly
partly partner partnership passing passionately passive password pathway patient pattern pause peak
peculiar peer penalty pension pepper percentage perception perfect perfectly perform performance perhaps
permanent permission permit persist personal personality personnel perspective persuade persuasion
phenomenon philosopher philosophy phone photograph photographer photography phrase physical physician
physics piano pick picture pie piece pilot pine pipe pitch pixel pizza placement plain planet platform
plausible pleasant plenty plot plugin plugin poetry poetic point poisoning polar police policy polite
political politics poll pollute pollution pond pool popularity population porch portion pose position
positive possess possession possibility possible possibly postage poster pot potato potential pound pour
poverty powder powerful practical practically practice praise pray prayer precisely pregnancy pregnant
preparation prepare prescription presence presentation preserve presidency president pressure pretend
pretty previous previously pride primarily primary prime prince princess principle print priority prison
prisoner privacy private prize probable procedure proceed proceedings proceed process produce producer
production profession professional professor profile profit profound program programmer progress
progressive prohibit project projection promise promote promotion prompt proof proper properly property
proportion proposal propose prospect protect protection protein protest proud prove province provision
proud psychology psychological public publication publicity publish publisher pull punish punishment
purchase pure purely purple purpose pursue pursuit push qualify quality quantity quarter queen query
quest queue quiet quote racial racism radical randomly ranking rapid rate ratio raw reach react reaction
reader readily reading realistic reality realize reasonable reasoning rebel recall receipt receive recently
reception recession recognize recognition recommend recommendation reconstruct record recovery recruit
recycle red reduce reduction referendum reflect reflection reflex reform refugee refund refuse region
regional register regret regular regulation reinforce reject relate related relation relationship relative
relatively relax release relevant relief relieve religion religious rely remain remainder remark remarkable
remedy remind remote removal remove renewal rent repair repeat repeatedly replace replacement reporter
represent representation representative republic reputation request require requirement rescue research
researcher reservation reserve reside residence resident residential resist resistance resolution resolve
resort resource respect respectable respond response responsibility responsible restaurant restore
restriction result resume retail retain retirement retrieve return reveal revelation revenue reverse
review revise revolution reward rhythm ribbon rich ride ridiculous rifle ring ripe ritual rival river
roast rob robot rocket rod role romance romantic rope rough routine row royal ruin rural rush sacred
safety sailor saint salary salt salvation sand sandwich satellite satisfy save sauce scale scandal scan
scare scenario schedule scheme scholar scholarship school science scientific scientist scope score
scratch scream screen script sculpture seal season seat secondary secret secretary section sector secure
security seek seemingly segment seize selection self semester senior sense sensible sensitive sensitivity
sentence separate sequence series serious seriously serve session settlement settle setup severe shadow
shake shame shape shark shed shelf shell shelter shift shine ship shirt shock shoot shore short shortly
shot shoulder shout shutdown shuffle sick side sickness siege sigh sight sign signal significance significantly
silence silent silly silver similar similarly simple simplicity simplify sin sincere single singular sink
situation sketch skilled skill skin skirt slave sleep slice slide slight slim slip slope smart smell smoke
smooth snake snap social socialist society soft software soil solar soldier sole solid solution somehow
somewhat somewhere song sophisticated sore sorrow sorrow sort soul soy space spacecraft spam specifically
specify spectator spectrum speech speedy spell spelling spend sphere spice spin spirit spiritual split
spokesperson sponsor sport spot spread spring spy squeeze stability stable stack stadium staff stadium
stamp stance standpoint star stare start starter startup statement static station statistic status steady
steal steam steel steep stem stereotype stick stiff still stimulus stock stomach stone storage storm story
stove straightforward strain strategy straw stream strength strengthen stress stretch strict strike string
strip stroke structure struggle studio stuff stumble stupid subject submit subsequent substitute subtle
suburb succeed success successful sudden suffer suffering sufficient suggest suggestion suicide suit
suite summary summit summon super superb supplier support suppose suppress supreme surface surgery surplus
surprise surrender surround survey survive survivor suspect suspend suspicion sustain sustainable swap
swear sweat sweep sweet swell swift swim swing switch symbol symbolic sympathy syndrome synthesis system
tablet tackle tail tale talent tap tape target task taste taught tax technique technology teenage temporary
tender tent tenure terminal terminate terrain terrain terrible territory terror testimony textbook texture
theme theoretical theory therapy thereby thermal thesis thick thigh thin thoroughly threat threaten threshold
throat throne verdict verification version vibrate victim victory video violent virtually virtue vision
visual vital vitamin vocabulary voice volume voluntary volunteer wage wagon waist walkway wall wander warn
warning wash waste watch weaken weapon wear weary website wedge weed weekly weep weird welcome welfare
widely width witness womb wonderful wooden woollen workshop worried worth worthy wreck wrist yarn zeal
zenith zoo zero zone zoom
`;

const NAMES = "jane john mary elizabeth susan";

const WORD_SET: Set<string> = new Set();
for (const w of `${BASE_WORDS} ${EXTRA_WORDS} ${NAMES}`.toLowerCase().split(/\s+/)) {
  if (w) WORD_SET.add(w);
}

const ignored = new Set<string>();
const custom = new Set<string>();

export function isDictionaryWord(w: string): boolean {
  const key = w.toLowerCase();
  return WORD_SET.has(key) || custom.has(key) || w.length === 1;
}

export const isIgnoredWord = (w: string) => ignored.has(w.toLowerCase());
export function ignoreWord(w: string) {
  ignored.add(w.toLowerCase());
}
export function addToDictionary(w: string) {
  custom.add(w.toLowerCase());
}

/** Levenshtein distance limited to <=2 (returns 3 for larger). */
function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[b.length];
}

export function suggestionsFor(word: string, max = 5): string[] {
  const w = word.toLowerCase();
  if (w.length < 3) return [];
  const out: string[] = [];
  for (const candidate of WORD_SET) {
    if (out.length >= max * 2) break;
    const d = editDistance(w, candidate);
    if (d <= 2) out.push(candidate);
  }
  return out.slice(0, max);
}

/* ================= Thesaurus ================= */

export const THESAURUS: Record<string, string[]> = {
  good: ["excellent", "fine", "great", "superior", "positive", "virtuous"],
  bad: ["poor", "awful", "terrible", "harmful", "unfavorable", "wicked"],
  happy: ["glad", "cheerful", "delighted", "joyful", "content", "pleased"],
  sad: ["unhappy", "sorrowful", "gloomy", "downcast", "melancholy", "mournful"],
  big: ["large", "huge", "enormous", "immense", "massive", "giant"],
  small: ["little", "tiny", "petite", "compact", "miniature", "slight"],
  fast: ["quick", "rapid", "swift", "speedy", "brisk", "hasty"],
  slow: ["unhurried", "gradual", "leisurely", "sluggish", "tedious", "dawdling"],
  nice: ["pleasant", "agreeable", "kind", "lovely", "fine", "delightful"],
  angry: ["furious", "irate", "annoyed", "fuming", "resentful", "outraged"],
  beautiful: ["pretty", "lovely", "gorgeous", "stunning", "attractive", "radiant"],
  smart: ["intelligent", "clever", "bright", "wise", "sharp", "astute"],
  important: ["significant", "crucial", "vital", "essential", "major", "critical"],
  strong: ["powerful", "robust", "sturdy", "hearty", "muscular", "forceful"],
  weak: ["frail", "feeble", "fragile", "powerless", "flimsy", "vulnerable"],
  rich: ["wealthy", "affluent", "prosperous", "opulent", "well-off", "flush"],
  poor: ["impoverished", "destitute", "needy", "indigent", "penniless", "broke"],
  easy: ["simple", "effortless", "straightforward", "untroubled", "smooth", "uncomplicated"],
  hard: ["difficult", "tough", "challenging", "arduous", "strenuous", "demanding"],
  look: ["view", "gaze", "glance", "stare", "watch", "observe"],
  see: ["view", "observe", "notice", "spot", "perceive", "witness"],
  think: ["believe", "consider", "ponder", "reflect", "contemplate", "deem"],
  help: ["assist", "aid", "support", "succor", "serve", "back"],
  make: ["create", "produce", "construct", "manufacture", "fabricate", "form"],
  get: ["obtain", "acquire", "receive", "gain", "secure", "attain"],
  take: ["seize", "grab", "grasp", "capture", "claim", "acquire"],
  house: ["home", "dwelling", "residence", "abode", "domicile", "household"],
  car: ["automobile", "vehicle", "auto", "motorcar", "sedan", "coupe"],
  child: ["kid", "youngster", "minor", "youth", "infant", "toddler"],
  friend: ["companion", "pal", "buddy", "ally", "confidant", "colleague"],
  money: ["cash", "currency", "funds", "capital", "wealth", "dough"],
  new: ["fresh", "novel", "modern", "recent", "original", "innovative"],
  old: ["aged", "ancient", "elderly", "vintage", "senior", "former"],
  run: ["sprint", "jog", "dash", "gallop", "hasten", "move"],
  walk: ["stroll", "stride", "march", "amble", "pace", "wander"],
  talk: ["speak", "chat", "converse", "communicate", "discuss", "gab"],
  read: ["peruse", "scan", "study", "browse", "skim", "devour"],
  write: ["compose", "draft", "author", "pen", "record", "inscribe"],
  work: ["labor", "toil", "endeavor", "employment", "task", "effort"],
  rest: ["relax", "repose", "pause", "unwind", "ease", "respite"],
  laugh: ["chuckle", "giggle", "snicker", "cackle", "grin", "chortle"],
  cry: ["weep", "sob", "wail", "mourn", "bawl", "lament"],
  say: ["state", "declare", "remark", "mention", "utter", "pronounce"],
  go: ["proceed", "depart", "move", "travel", "advance", "progress"],
  come: ["arrive", "approach", "appear", "enter", "near", "advance"],
  begin: ["start", "commence", "initiate", "inaugurate", "launch", "open"],
  end: ["finish", "conclude", "terminate", "cease", "complete", "conclude"],
  love: ["adore", "cherish", "treasure", "admire", "worship", "fancy"],
  hate: ["detest", "loathe", "despise", "abhor", "dislike", "revile"],
  great: ["excellent", "wonderful", "marvelous", "superb", "terrific", "fantastic"],
  many: ["numerous", "countless", "various", "multiple", "myriad", "abundant"],
  buy: ["purchase", "acquire", "obtain", "procure", "payout", "contract"],
  travel: ["journey", "tour", "voyage", "trek", "expedition", "cruise"],
  world: ["earth", "globe", "planet", "universe", "realm", "sphere"],
  school: ["academy", "institute", "campus", "college", "seminary", "academic institution"],
  true: ["accurate", "correct", "factual", "genuine", "veritable", "authentic"],
  false: ["untrue", "incorrect", "wrong", "inaccurate", "fallacious", "fictitious"],
  common: ["usual", "ordinary", "frequent", "regular", "typical", "general"],
  rare: ["uncommon", "scarce", "unusual", "infrequent", "exceptional", "unheard-of"],
  clear: ["obvious", "plain", "evident", "apparent", "transparent", "lucid"],
  hidden: ["concealed", "secret", "obscure", "covert", "masked", "buried"],
  cold: ["chilly", "frosty", "icy", "cool", "frigid", "glacial"],
  hot: ["warm", "scorching", "boiling", "heated", "fiery", "torrid"],
  sweet: ["sugary", "honeyed", "pleasant", "delightful", "saccharine", "fresh"],
  bitter: ["acidic", "harsh", "sour", "acrid", "sharp", "resentful"],
  stop: ["cease", "halt", "desist", "conclude", "pause", "terminate"],
  remember: ["recall", "recollect", "reminisce", "retain", "bear in mind", "revisit"],
  forget: ["overlook", "neglect", "disregard", "omit", "misremember", "lose sight of"],
};

/* ================= Translation glossary ================= */

type LangCode = "es" | "fr" | "de";

const GLOSSARY: Record<string, Partial<Record<LangCode, string>>> = {
  hello: { es: "hola", fr: "bonjour", de: "hallo" },
  goodbye: { es: "adiós", fr: "au revoir", de: "auf Wiedersehen" },
  please: { es: "por favor", fr: "s'il vous plaît", de: "bitte" },
  thank: { es: "gracias", fr: "merci", de: "danke" },
  you: { es: "tú", fr: "vous", de: "du" },
  yes: { es: "sí", fr: "oui", de: "ja" },
  no: { es: "no", fr: "non", de: "nein" },
  the: { es: "el", fr: "le", de: "der" },
  a: { es: "un", fr: "un", de: "ein" },
  an: { es: "un", fr: "un", de: "ein" },
  good: { es: "bueno", fr: "bon", de: "gut" },
  morning: { es: "mañana", fr: "matin", de: "Morgen" },
  night: { es: "noche", fr: "nuit", de: "Nacht" },
  day: { es: "día", fr: "jour", de: "Tag" },
  world: { es: "mundo", fr: "monde", de: "Welt" },
  water: { es: "agua", fr: "eau", de: "Wasser" },
  food: { es: "comida", fr: "nourriture", de: "Essen" },
  love: { es: "amor", fr: "amour", de: "Liebe" },
  friend: { es: "amigo", fr: "ami", de: "Freund" },
  house: { es: "casa", fr: "maison", de: "Haus" },
  car: { es: "coche", fr: "voiture", de: "Auto" },
  book: { es: "libro", fr: "livre", de: "Buch" },
  word: { es: "palabra", fr: "mot", de: "Wort" },
  happy: { es: "feliz", fr: "heureux", de: "glücklich" },
  sad: { es: "triste", fr: "triste", de: "traurig" },
  big: { es: "grande", fr: "grand", de: "groß" },
  small: { es: "pequeño", fr: "petit", de: "klein" },
  new: { es: "nuevo", fr: "nouveau", de: "neu" },
  old: { es: "viejo", fr: "vieux", de: "alt" },
  beautiful: { es: "hermoso", fr: "beau", de: "schön" },
  man: { es: "hombre", fr: "homme", de: "Mann" },
  woman: { es: "mujer", fr: "femme", de: "Frau" },
  child: { es: "niño", fr: "enfant", de: "Kind" },
  sun: { es: "sol", fr: "soleil", de: "Sonne" },
  moon: { es: "luna", fr: "lune", de: "Mond" },
  star: { es: "estrella", fr: "étoile", de: "Stern" },
  school: { es: "escuela", fr: "école", de: "Schule" },
  teacher: { es: "maestro", fr: "enseignant", de: "Lehrer" },
  city: { es: "ciudad", fr: "ville", de: "Stadt" },
};

export function translateText(
  text: string,
  lang: LangCode,
): { text: string; found: number; total: number } {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const total = words.length;
  if (total === 0) return { text: "", found: 0, total: 0 };
  let found = 0;
  const out = words.map((w) => {
    const key = w.toLowerCase().replace(/[^a-zà-ÿ']/g, "");
    const entry = key ? GLOSSARY[key]?.[lang] : undefined;
    if (entry) {
      found++;
      return entry;
    }
    return `[${w}]`;
  });
  return { text: out.join(" "), found, total };
}

/* ================= Word diff (Compare) ================= */

export type DiffOp = { type: "equal" | "insert" | "delete"; text: string };

export function diffWords(a: string, b: string): DiffOp[] {
  const wa = a.split(/(\s+)/).filter((s) => s.length > 0);
  const wb = b.split(/(\s+)/).filter((s) => s.length > 0);
  const n = wa.length;
  const m = wb.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        wa[i] === wb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (wa[i] === wb[j]) {
      ops.push({ type: "equal", text: wa[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", text: wa[i] });
      i++;
    } else {
      ops.push({ type: "insert", text: wb[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "delete", text: wa[i++] });
  while (j < m) ops.push({ type: "insert", text: wb[j++] });
  return ops;
}

/* ================= Word count ================= */

export function countWords(doc: Node) {
  const text = doc.textBetween(0, doc.content.size, "\n", " ");
  const words = text.trim() ? text.match(/[A-Za-zà-ÿ0-9]+(?:['’-][A-Za-zà-ÿ0-9]+)*/g)?.length ?? 0 : 0;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const charsWithSpaces = text.length;
  let paragraphs = 0;
  doc.descendants((node) => {
    if (node.isTextblock) paragraphs++;
    return true;
  });
  const lines = Math.max(1, Math.round(charsWithSpaces / 100) || 1);
  const pages = Math.max(1, Math.round(words / 400) || 1);
  return { words, charsNoSpaces, charsWithSpaces, paragraphs, lines, pages };
}

/* ================= Accessibility scan ================= */

export type A11yIssue =
  | { kind: "image-alt"; from: number; to: number; label: string }
  | { kind: "blank-paragraph"; from: number; to: number; label: string }
  | { kind: "repeated-spaces"; from: number; to: number; label: string }
  | { kind: "low-contrast-missing-style"; from: number; to: number; label: string };

export function scanAccessibility(doc: Node): A11yIssue[] {
  const issues: A11yIssue[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "image") {
      const alt = node.attrs.alt as string | undefined;
      if (!alt || !alt.trim()) {
        issues.push({
          kind: "image-alt",
          from: pos,
          to: pos + node.nodeSize,
          label: "Picture without Alt Text",
        });
      }
    }
    if (node.isTextblock) {
      const text = node.textContent;
      if (!text.trim()) {
        issues.push({
          kind: "blank-paragraph",
          from: pos,
          to: pos + node.nodeSize,
          label: "Blank paragraph",
        });
      }
    }
    if (node.isText && node.text && /\s{2,}/.test(node.text)) {
      issues.push({
        kind: "repeated-spaces",
        from: pos,
        to: pos + node.nodeSize,
        label: "Several repeated white spaces",
      });
    }
    return true;
  });
  return issues;
}

/* ================= Read aloud ================= */

export function buildSpeechText(doc: Node, from?: number, to?: number): string {
  if (typeof to === "number" && typeof from === "number") {
    return doc.textBetween(from, to, "\n", " ");
  }
  return doc.textBetween(0, doc.content.size, "\n", ". ");
}