// Countries that don't appear as separate clickable regions in the topojson
// (micro-atolls, city-states, and territories with topojson representation issues)
export const MAP_EXCLUDED = new Set<string>([
  "mv", "tv", "nr", "mh", "ki", "fm", "pw", // Pacific micro-atolls
  "sc", "km", "st", "mu", "cv",              // Indian/Atlantic tiny islands
  "mc", "va", "sm", "li", "ad", "xk",        // European micro-states / Kosovo
  "tw", "ps",                                 // Taiwan (China issue) / Palestine
]);

// ISO 3166-1 numeric → ISO 3166-1 alpha-2
// Used to map world-atlas topojson feature IDs to our country records
export const NUM_TO_ISO2: Record<number, string> = {
  // Americas
  28:"ag",  32:"ar",  44:"bs",  52:"bb",  84:"bz",  68:"bo",  76:"br", 124:"ca",
  152:"cl", 170:"co", 188:"cr", 192:"cu", 212:"dm", 214:"do", 218:"ec", 222:"sv",
  308:"gd", 320:"gt", 328:"gy", 332:"ht", 340:"hn", 388:"jm", 484:"mx", 558:"ni",
  591:"pa", 600:"py", 604:"pe", 659:"kn", 662:"lc", 670:"vc", 740:"sr", 780:"tt",
  840:"us", 858:"uy", 862:"ve",
  // Europe
  8:"al",   20:"ad",  40:"at",  56:"be",  70:"ba", 100:"bg", 112:"by", 191:"hr",
  196:"cy", 203:"cz", 208:"dk", 233:"ee", 246:"fi", 250:"fr", 268:"ge", 276:"de",
  300:"gr", 348:"hu", 352:"is", 372:"ie", 380:"it", 383:"xk", 428:"lv", 438:"li",
  440:"lt", 442:"lu", 470:"mt", 492:"mc", 498:"md", 499:"me", 528:"nl", 578:"no",
  616:"pl", 620:"pt", 642:"ro", 643:"ru", 674:"sm", 688:"rs", 703:"sk", 705:"si",
  724:"es", 752:"se", 756:"ch", 792:"tr", 804:"ua", 807:"mk", 826:"gb", 336:"va",
  31:"az",  51:"am",
  // Asia
  4:"af",   48:"bh",  50:"bd",  64:"bt",  96:"bn", 116:"kh", 156:"cn", 356:"in",
  360:"id", 368:"iq", 376:"il", 392:"jp", 400:"jo", 398:"kz", 414:"kw", 417:"kg",
  418:"la", 422:"lb", 458:"my", 462:"mv", 496:"mn", 104:"mm", 524:"np", 408:"kp",
  512:"om", 586:"pk", 275:"ps", 608:"ph", 634:"qa", 682:"sa", 702:"sg", 410:"kr",
  144:"lk", 760:"sy", 158:"tw", 762:"tj", 764:"th", 626:"tl", 795:"tm", 784:"ae",
  860:"uz", 704:"vn", 887:"ye",
  // Africa
  12:"dz",  24:"ao", 204:"bj",  72:"bw", 854:"bf", 108:"bi", 132:"cv", 120:"cm",
  140:"cf", 148:"td", 174:"km", 180:"cd", 262:"dj", 818:"eg", 226:"gq", 232:"er",
  748:"sz", 231:"et", 266:"ga", 270:"gm", 288:"gh", 324:"gn", 624:"gw", 384:"ci",
  404:"ke", 426:"ls", 430:"lr", 434:"ly", 450:"mg", 454:"mw", 466:"ml", 478:"mr",
  480:"mu", 504:"ma", 508:"mz", 516:"na", 562:"ne", 566:"ng", 178:"cg", 646:"rw",
  678:"st", 686:"sn", 690:"sc", 694:"sl", 706:"so", 710:"za", 728:"ss", 729:"sd",
  834:"tz", 768:"tg", 788:"tn", 800:"ug", 894:"zm", 716:"zw",
  // Oceania
  36:"au",  242:"fj", 296:"ki", 584:"mh", 583:"fm", 520:"nr", 554:"nz", 585:"pw",
  598:"pg", 882:"ws",  90:"sb", 776:"to", 798:"tv", 548:"vu",
};

export const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
