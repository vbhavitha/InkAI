const handwritingPresets = [
  // ============================================================
  // NEAT STUDENT
  // ============================================================
  {
    id: "neat_student",

    name: "Neat Student",

    description:
      "Clean, consistent handwriting suitable for notes and assignments.",

    font: "neat_student",

    paper: "ruled",

    ink: "blue",

    fontSize: 22,

    letterSpacing: 0,

    lineSpacing: 1.5,

    wordSpacing: 4,

    inkOpacity: 0.9,

    naturalness: 25,

    naturalVariation: true,

    seed: 12345,
  },

  // ============================================================
  // SCHOOL NOTEBOOK
  // ============================================================
  {
    id: "school_notebook",

    name: "School Notebook",

    description:
      "Natural classroom-style handwriting with moderate variation.",

    font: "school_notebook",

    paper: "ruled",

    ink: "blue",

    fontSize: 22,

    letterSpacing: 0.5,

    lineSpacing: 1.5,

    wordSpacing: 5,

    inkOpacity: 0.9,

    naturalness: 50,

    naturalVariation: true,

    seed: 12345,
  },

  // ============================================================
  // CURSIVE
  // ============================================================
  {
    id: "cursive",

    name: "Cursive",

    description:
      "Smooth flowing handwriting with a clean cursive appearance.",

    font: "cursive",

    paper: "plain",

    ink: "black",

    fontSize: 23,

    letterSpacing: 0.5,

    lineSpacing: 1.5,

    wordSpacing: 5,

    inkOpacity: 0.9,

    naturalness: 30,

    naturalVariation: true,

    seed: 12345,
  },

  // ============================================================
  // MESSY NOTES
  // ============================================================
  {
    id: "messy_notes",

    name: "Messy Notes",

    description:
      "Loose and irregular handwriting designed to resemble quick notes.",

    font: "casual_handwriting",

    paper: "notebook",

    ink: "blue",

    fontSize: 22,

    letterSpacing: 1,

    lineSpacing: 1.55,

    wordSpacing: 7,

    inkOpacity: 0.86,

    naturalness: 80,

    naturalVariation: true,

    seed: 12345,
  },

  // ============================================================
  // PENCIL
  // ============================================================
  {
    id: "pencil",

    name: "Pencil",

    description:
      "Soft gray pencil-style handwriting with subtle texture.",

    font: "pencil_writing",

    paper: "notebook",

    ink: "pencil",

    fontSize: 22,

    letterSpacing: 0.5,

    lineSpacing: 1.5,

    wordSpacing: 5,

    inkOpacity: 0.82,

    naturalness: 55,

    naturalVariation: true,

    seed: 12345,

    texture: true,
  },
];

export default handwritingPresets;