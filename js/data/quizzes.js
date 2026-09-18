// Chemical Equation Balancing and Speed Challenges Database
export const EQUATION_CHALLENGES = [
  {
    id: "eq_1",
    titleAr: "وزن معادلة تكوين الماء",
    titleEn: "Balance Water Synthesis",
    equationText: "? H₂ + ? O₂ → ? H₂O",
    reactants: [
      { formula: "H₂", elements: { H: 2 } },
      { formula: "O₂", elements: { O: 2 } }
    ],
    products: [
      { formula: "H₂O", elements: { H: 2, O: 1 } }
    ],
    correctCoeffs: [2, 1, 2], // 2 H2 + 1 O2 -> 2 H2O
    balancedFormula: "2H₂ + O₂ → 2H₂O",
    difficulty: "easy",
    points: 100,
    hintAr: "ابدأ بمساواة ذرات الأكسجين أولاً، ثم اضبط ذرات الهيدروجين.",
    hintEn: "Balance Oxygen first, then adjust Hydrogen on the reactant side."
  },
  {
    id: "eq_2",
    titleAr: "وزن تفاعل تكوين الأمونيا",
    titleEn: "Balance Ammonia Synthesis",
    equationText: "? N₂ + ? H₂ → ? NH₃",
    reactants: [
      { formula: "N₂", elements: { N: 2 } },
      { formula: "H₂", elements: { H: 2 } }
    ],
    products: [
      { formula: "NH₃", elements: { N: 1, H: 3 } }
    ],
    correctCoeffs: [1, 3, 2], // 1 N2 + 3 H2 -> 2 NH3
    balancedFormula: "N₂ + 3H₂ → 2NH₃",
    difficulty: "easy",
    points: 120,
    hintAr: "تحتاج جزيئي أمونيا لمساواة ذرتي النيتروجين، كم هيدروجيناً تحتاج؟",
    hintEn: "Two NH3 molecules require 6 Hydrogen atoms (3 H2)."
  },
  {
    id: "eq_3",
    titleAr: "وزن احتراق غاز الميثان",
    titleEn: "Balance Methane Combustion",
    equationText: "? CH₄ + ? O₂ → ? CO₂ + ? H₂O",
    reactants: [
      { formula: "CH₄", elements: { C: 1, H: 4 } },
      { formula: "O₂", elements: { O: 2 } }
    ],
    products: [
      { formula: "CO₂", elements: { C: 1, O: 2 } },
      { formula: "H₂O", elements: { H: 2, O: 1 } }
    ],
    correctCoeffs: [1, 2, 1, 2], // 1 CH4 + 2 O2 -> 1 CO2 + 2 H2O
    balancedFormula: "CH₄ + 2O₂ → CO₂ + 2H₂O",
    difficulty: "medium",
    points: 150,
    hintAr: "الكربون متوازن (1). اضبط الهيدروجين (4 ذرات تعطي 2 H2O) ثم اجمع الأكسجين في النواتج (2+2=4).",
    hintEn: "Balance H by using 2 H2O, giving 4 O atoms in products, needing 2 O2."
  },
  {
    id: "eq_4",
    titleAr: "وزن أكسدة الحديد وتكوين الصدأ",
    titleEn: "Balance Iron Rusting",
    equationText: "? Fe + ? O₂ → ? Fe₂O₃",
    reactants: [
      { formula: "Fe", elements: { Fe: 1 } },
      { formula: "O₂", elements: { O: 2 } }
    ],
    products: [
      { formula: "Fe₂O₃", elements: { Fe: 2, O: 3 } }
    ],
    correctCoeffs: [4, 3, 2], // 4 Fe + 3 O2 -> 2 Fe2O3
    balancedFormula: "4Fe + 3O₂ → 2Fe₂O₃",
    difficulty: "hard",
    points: 200,
    hintAr: "المضاعف المشترك الأصغر لذرات الأكسجين (2 و 3) هو 6، إذن 3 O2 تنتج 2 Fe2O3.",
    hintEn: "The lowest common multiple for Oxygen is 6: 3 O2 produces 2 Fe2O3."
  },
  {
    id: "eq_5",
    titleAr: "وزن تفكك فوق أكسيد الهيدروجين",
    titleEn: "Balance Hydrogen Peroxide Decomposition",
    equationText: "? H₂O₂ → ? H₂O + ? O₂",
    reactants: [
      { formula: "H₂O₂", elements: { H: 2, O: 2 } }
    ],
    products: [
      { formula: "H₂O", elements: { H: 2, O: 1 } },
      { formula: "O₂", elements: { O: 2 } }
    ],
    correctCoeffs: [2, 2, 1], // 2 H2O2 -> 2 H2O + 1 O2
    balancedFormula: "2H₂O₂ → 2H₂O + O₂",
    difficulty: "medium",
    points: 160,
    hintAr: "جزيئان من H2O2 يمنحان 4 ذرات H و 4 ذرات O.",
    hintEn: "2 molecules of H2O2 yield 2 H2O + 1 O2."
  },
  {
    id: "eq_6",
    titleAr: "وزن تفاعل أكسدة الألومنيوم للحراريات",
    titleEn: "Balance Aluminium Oxide Synthesis",
    equationText: "? Al + ? O₂ → ? Al₂O₃",
    reactants: [
      { formula: "Al", elements: { Al: 1 } },
      { formula: "O₂", elements: { O: 2 } }
    ],
    products: [
      { formula: "Al₂O₃", elements: { Al: 2, O: 3 } }
    ],
    correctCoeffs: [4, 3, 2], // 4 Al + 3 O2 -> 2 Al2O3
    balancedFormula: "4Al + 3O₂ → 2Al₂O₃",
    difficulty: "hard",
    points: 220,
    hintAr: "نفس نمط أكسدة الحديد! 4 ذرات ألومنيوم مع 3 جزيئات أكسجين.",
    hintEn: "Same stoichiometry as iron rusting: 4 Al + 3 O2 -> 2 Al2O3."
  }
];

export const CHEMISTRY_FLASH_QUIZZES = [
  {
    questionAr: "ما هو العنصر الأكثر وفرة في الكون بأسره؟",
    questionEn: "Which element is the most abundant in the entire universe?",
    optionsAr: ["الهيدروجين (H)", "الأكسجين (O)", "النيتروجين (N)", "الكربون (C)"],
    optionsEn: ["Hydrogen (H)", "Oxygen (O)", "Nitrogen (N)", "Carbon (C)"],
    correct: 0,
    explanationAr: "يشكل الهيدروجين حوالي 75% من الكتلة الباريونية للكون ويشكل الوقود الأساسي لنجوم المجرات."
  },
  {
    questionAr: "عند اتحاد فلز الصوديوم مع غاز الكلور، ما نوع الرابطة المتكونة؟",
    questionEn: "When Sodium metal bonds with Chlorine gas, what type of bond forms?",
    optionsAr: ["رابطة تساهمية", "رابطة أيونية", "رابطة هيدروجينية", "رابطة فلزية"],
    optionsEn: ["Covalent bond", "Ionic bond", "Hydrogen bond", "Metallic bond"],
    correct: 1,
    explanationAr: "يفقد الصوديوم إلكترون تكافؤه للكلور ليكونا كاتيون Na+ وأنيون Cl- ينجذبان بقوة كهروستاتيكية أيونية."
  },
  {
    questionAr: "التفاعل الذي يطلق طاقة حرارية إلى الوسط المحيط يُسمى تفاعلاً:",
    questionEn: "A reaction that releases thermal energy into the surrounding environment is called:",
    optionsAr: ["طارداً للحرارة (Exothermic)", "ماصاً للحرارة (Endothermic)", "تفاعلاً ضوئياً", "تفككاً حرارياً"],
    optionsEn: ["Exothermic", "Endothermic", "Photolytic", "Thermal decomposition"],
    correct: 0,
    explanationAr: "التفاعلات الطاردة للحرارة تتميز بقيمة إنتالبي سالبة (ΔH < 0) وتؤدي لارتفاع حرارة الوعاء."
  },
  {
    questionAr: "ما هو الرقم الهيدروجيني (pH) للمحلول المتعادل تماماً مثل الماء النقي عند 25°C؟",
    questionEn: "What is the pH value of a completely neutral solution like pure water at 25°C?",
    optionsAr: ["0", "7", "14", "1"],
    optionsEn: ["0", "7", "14", "1"],
    correct: 1,
    explanationAr: "في المحلول المتعادل يتساوى تركيز أيونات [H+] مع [OH-] مما يعطي pH = 7."
  }
];
