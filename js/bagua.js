/**
 * 梅花易数核心算法
 * 八卦/六十四卦数据 + 起卦逻辑
 */

const TRIGRAMS = {
  1: { name: '乾', nature: '天', element: '金', symbol: '☰', lines: [1,1,1], attr: '刚健' },
  2: { name: '兑', nature: '泽', element: '金', symbol: '☱', lines: [1,1,0], attr: '喜悦' },
  3: { name: '离', nature: '火', element: '火', symbol: '☲', lines: [1,0,1], attr: '光明' },
  4: { name: '震', nature: '雷', element: '木', symbol: '☳', lines: [1,0,0], attr: '动' },
  5: { name: '巽', nature: '风', element: '木', symbol: '☴', lines: [0,1,1], attr: '入' },
  6: { name: '坎', nature: '水', element: '水', symbol: '☵', lines: [0,1,0], attr: '险' },
  7: { name: '艮', nature: '山', element: '土', symbol: '☶', lines: [0,0,1], attr: '止' },
  8: { name: '坤', nature: '地', element: '土', symbol: '☷', lines: [0,0,0], attr: '顺' },
};

const DIZHI_SHICHEN = [
  { name: '子', hours: [23,0], num: 1 },
  { name: '丑', hours: [1,2], num: 2 },
  { name: '寅', hours: [3,4], num: 3 },
  { name: '卯', hours: [5,6], num: 4 },
  { name: '辰', hours: [7,8], num: 5 },
  { name: '巳', hours: [9,10], num: 6 },
  { name: '午', hours: [11,12], num: 7 },
  { name: '未', hours: [13,14], num: 8 },
  { name: '申', hours: [15,16], num: 9 },
  { name: '酉', hours: [17,18], num: 10 },
  { name: '戌', hours: [19,20], num: 11 },
  { name: '亥', hours: [21,22], num: 12 },
];

// (上卦number, 下卦number) => 卦名
const HEXAGRAM_MAP = {
  '1,1': { name: '乾为天', short: '乾', num: 1 },
  '1,2': { name: '天泽履', short: '履', num: 10 },
  '1,3': { name: '天火同人', short: '同人', num: 13 },
  '1,4': { name: '天雷无妄', short: '无妄', num: 25 },
  '1,5': { name: '天风姤', short: '姤', num: 44 },
  '1,6': { name: '天水讼', short: '讼', num: 6 },
  '1,7': { name: '天山遁', short: '遁', num: 33 },
  '1,8': { name: '天地否', short: '否', num: 12 },
  '2,1': { name: '泽天夬', short: '夬', num: 43 },
  '2,2': { name: '兑为泽', short: '兑', num: 58 },
  '2,3': { name: '泽火革', short: '革', num: 49 },
  '2,4': { name: '泽雷随', short: '随', num: 17 },
  '2,5': { name: '泽风大过', short: '大过', num: 28 },
  '2,6': { name: '泽水困', short: '困', num: 47 },
  '2,7': { name: '泽山咸', short: '咸', num: 31 },
  '2,8': { name: '泽地萃', short: '萃', num: 45 },
  '3,1': { name: '火天大有', short: '大有', num: 14 },
  '3,2': { name: '火泽睽', short: '睽', num: 38 },
  '3,3': { name: '离为火', short: '离', num: 30 },
  '3,4': { name: '火雷噬嗑', short: '噬嗑', num: 21 },
  '3,5': { name: '火风鼎', short: '鼎', num: 50 },
  '3,6': { name: '火水未济', short: '未济', num: 64 },
  '3,7': { name: '火山旅', short: '旅', num: 56 },
  '3,8': { name: '火地晋', short: '晋', num: 35 },
  '4,1': { name: '雷天大壮', short: '大壮', num: 34 },
  '4,2': { name: '雷泽归妹', short: '归妹', num: 54 },
  '4,3': { name: '雷火丰', short: '丰', num: 55 },
  '4,4': { name: '震为雷', short: '震', num: 51 },
  '4,5': { name: '雷风恒', short: '恒', num: 32 },
  '4,6': { name: '雷水解', short: '解', num: 40 },
  '4,7': { name: '雷山小过', short: '小过', num: 62 },
  '4,8': { name: '雷地豫', short: '豫', num: 16 },
  '5,1': { name: '风天小畜', short: '小畜', num: 9 },
  '5,2': { name: '风泽中孚', short: '中孚', num: 61 },
  '5,3': { name: '风火家人', short: '家人', num: 37 },
  '5,4': { name: '风雷益', short: '益', num: 42 },
  '5,5': { name: '巽为风', short: '巽', num: 57 },
  '5,6': { name: '风水涣', short: '涣', num: 59 },
  '5,7': { name: '风山渐', short: '渐', num: 53 },
  '5,8': { name: '风地观', short: '观', num: 20 },
  '6,1': { name: '水天需', short: '需', num: 5 },
  '6,2': { name: '水泽节', short: '节', num: 60 },
  '6,3': { name: '水火既济', short: '既济', num: 63 },
  '6,4': { name: '水雷屯', short: '屯', num: 3 },
  '6,5': { name: '水风井', short: '井', num: 48 },
  '6,6': { name: '坎为水', short: '坎', num: 29 },
  '6,7': { name: '水山蹇', short: '蹇', num: 39 },
  '6,8': { name: '水地比', short: '比', num: 8 },
  '7,1': { name: '山天大畜', short: '大畜', num: 26 },
  '7,2': { name: '山泽损', short: '损', num: 41 },
  '7,3': { name: '山火贲', short: '贲', num: 22 },
  '7,4': { name: '山雷颐', short: '颐', num: 27 },
  '7,5': { name: '山风蛊', short: '蛊', num: 18 },
  '7,6': { name: '山水蒙', short: '蒙', num: 4 },
  '7,7': { name: '艮为山', short: '艮', num: 52 },
  '7,8': { name: '山地剥', short: '剥', num: 23 },
  '8,1': { name: '地天泰', short: '泰', num: 11 },
  '8,2': { name: '地泽临', short: '临', num: 19 },
  '8,3': { name: '地火明夷', short: '明夷', num: 36 },
  '8,4': { name: '地雷复', short: '复', num: 24 },
  '8,5': { name: '地风升', short: '升', num: 46 },
  '8,6': { name: '地水师', short: '师', num: 7 },
  '8,7': { name: '地山谦', short: '谦', num: 15 },
  '8,8': { name: '坤为地', short: '坤', num: 2 },
};

const WUXING_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const WUXING_KE   = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

function getCurrentShichen() {
  const h = new Date().getHours();
  if (h === 23 || h === 0) return DIZHI_SHICHEN[0];
  return DIZHI_SHICHEN.find(s => s.hours[0] === h || s.hours[1] === h) || DIZHI_SHICHEN[0];
}

function numToTrigramNum(n) {
  const r = n % 8;
  return r === 0 ? 8 : r;
}

function numToYaoNum(n) {
  const r = n % 6;
  return r === 0 ? 6 : r;
}

function getHexagramLines(upperNum, lowerNum) {
  const upper = TRIGRAMS[upperNum].lines;
  const lower = TRIGRAMS[lowerNum].lines;
  return [...lower, ...upper]; // index 0=初爻(bottom) ... 5=上爻(top)
}

function changeYao(lines, yaoPos) {
  const newLines = [...lines];
  const idx = yaoPos - 1;
  newLines[idx] = newLines[idx] === 1 ? 0 : 1;
  return newLines;
}

function linesToTrigrams(lines) {
  const lowerLines = lines.slice(0, 3);
  const upperLines = lines.slice(3, 6);
  const findTrigram = (ls) => {
    for (const [k, v] of Object.entries(TRIGRAMS)) {
      if (v.lines[0] === ls[0] && v.lines[1] === ls[1] && v.lines[2] === ls[2]) return parseInt(k);
    }
    return 1;
  };
  return { upper: findTrigram(upperLines), lower: findTrigram(lowerLines) };
}

function getHuGua(lines) {
  const huLower = [lines[1], lines[2], lines[3]];
  const huUpper = [lines[2], lines[3], lines[4]];
  const findTrigram = (ls) => {
    for (const [k, v] of Object.entries(TRIGRAMS)) {
      if (v.lines[0] === ls[0] && v.lines[1] === ls[1] && v.lines[2] === ls[2]) return parseInt(k);
    }
    return 1;
  };
  return { upper: findTrigram(huUpper), lower: findTrigram(huLower) };
}

function analyzeWuxing(tiNum, yongNum) {
  const tiElement = TRIGRAMS[tiNum].element;
  const yongElement = TRIGRAMS[yongNum].element;
  if (tiElement === yongElement) return { relation: '比和', luck: '平', desc: '体用同属，平稳和谐' };
  if (WUXING_SHENG[tiElement] === yongElement) return { relation: '体生用', luck: '小凶', desc: '精力外泄，有所付出' };
  if (WUXING_SHENG[yongElement] === tiElement) return { relation: '用生体', luck: '吉', desc: '外力助我，多有收获' };
  if (WUXING_KE[tiElement] === yongElement) return { relation: '体克用', luck: '小吉', desc: '我能驾驭局面，可得利' };
  if (WUXING_KE[yongElement] === tiElement) return { relation: '用克体', luck: '凶', desc: '外力压制我，阻碍较大' };
  return { relation: '未知', luck: '平', desc: '' };
}

/**
 * 字占核心：根据笔画数 + 当前时辰起卦
 * @param {number} strokeCount 汉字笔画数
 * @returns {object} 完整卦象信息
 */
function divineBySingleChar(strokeCount) {
  const shichen = getCurrentShichen();
  const N = strokeCount;
  const T = shichen.num;

  const upperNum = numToTrigramNum(N);
  const lowerNum = numToTrigramNum(N + T);
  const yaoPos   = numToYaoNum(N + T);

  // 本卦
  const benLines = getHexagramLines(upperNum, lowerNum);
  const benKey = `${upperNum},${lowerNum}`;
  const benGua = HEXAGRAM_MAP[benKey];

  // 变卦
  const bianLines = changeYao(benLines, yaoPos);
  const bianTrigrams = linesToTrigrams(bianLines);
  const bianKey = `${bianTrigrams.upper},${bianTrigrams.lower}`;
  const bianGua = HEXAGRAM_MAP[bianKey];

  // 互卦
  const huTrigrams = getHuGua(benLines);
  const huKey = `${huTrigrams.upper},${huTrigrams.lower}`;
  const huGua = HEXAGRAM_MAP[huKey];

  // 体用分析
  const tiNum = yaoPos <= 3 ? upperNum : lowerNum;
  const yongNum = yaoPos <= 3 ? lowerNum : upperNum;
  const wuxingAnalysis = analyzeWuxing(tiNum, yongNum);

  return {
    strokeCount: N,
    shichen: { name: shichen.name, num: T },
    upperTrigram: TRIGRAMS[upperNum],
    lowerTrigram: TRIGRAMS[lowerNum],
    upperNum, lowerNum,
    yaoPos,
    benGua: { ...benGua, lines: benLines, upperNum, lowerNum },
    bianGua: { ...bianGua, lines: bianLines, upperNum: bianTrigrams.upper, lowerNum: bianTrigrams.lower },
    huGua: { ...huGua, lines: getHexagramLines(huTrigrams.upper, huTrigrams.lower), upperNum: huTrigrams.upper, lowerNum: huTrigrams.lower },
    ti: { num: tiNum, ...TRIGRAMS[tiNum], role: '体' },
    yong: { num: yongNum, ...TRIGRAMS[yongNum], role: '用' },
    wuxing: wuxingAnalysis,
  };
}
