/**
 * Centralised reference data for Algeria's 58 wilayas (administrative
 * structure in force since the 2019 reform). Every feature must read wilaya
 * information from here or from the `Wilaya` table seeded from this file —
 * never hardcode wilaya names in the UI.
 */
export type WilayaRef = {
  id: number;
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
};

export const WILAYAS: readonly WilayaRef[] = [
  { id: 1, code: "01", nameAr: "أدرار", nameFr: "Adrar", nameEn: "Adrar" },
  { id: 2, code: "02", nameAr: "الشلف", nameFr: "Chlef", nameEn: "Chlef" },
  { id: 3, code: "03", nameAr: "الأغواط", nameFr: "Laghouat", nameEn: "Laghouat" },
  { id: 4, code: "04", nameAr: "أم البواقي", nameFr: "Oum El Bouaghi", nameEn: "Oum El Bouaghi" },
  { id: 5, code: "05", nameAr: "باتنة", nameFr: "Batna", nameEn: "Batna" },
  { id: 6, code: "06", nameAr: "بجاية", nameFr: "Béjaïa", nameEn: "Bejaia" },
  { id: 7, code: "07", nameAr: "بسكرة", nameFr: "Biskra", nameEn: "Biskra" },
  { id: 8, code: "08", nameAr: "بشار", nameFr: "Béchar", nameEn: "Bechar" },
  { id: 9, code: "09", nameAr: "البليدة", nameFr: "Blida", nameEn: "Blida" },
  { id: 10, code: "10", nameAr: "البويرة", nameFr: "Bouira", nameEn: "Bouira" },
  { id: 11, code: "11", nameAr: "تمنراست", nameFr: "Tamanrasset", nameEn: "Tamanrasset" },
  { id: 12, code: "12", nameAr: "تبسة", nameFr: "Tébessa", nameEn: "Tebessa" },
  { id: 13, code: "13", nameAr: "تلمسان", nameFr: "Tlemcen", nameEn: "Tlemcen" },
  { id: 14, code: "14", nameAr: "تيارت", nameFr: "Tiaret", nameEn: "Tiaret" },
  { id: 15, code: "15", nameAr: "تيزي وزو", nameFr: "Tizi Ouzou", nameEn: "Tizi Ouzou" },
  { id: 16, code: "16", nameAr: "الجزائر", nameFr: "Alger", nameEn: "Algiers" },
  { id: 17, code: "17", nameAr: "الجلفة", nameFr: "Djelfa", nameEn: "Djelfa" },
  { id: 18, code: "18", nameAr: "جيجل", nameFr: "Jijel", nameEn: "Jijel" },
  { id: 19, code: "19", nameAr: "سطيف", nameFr: "Sétif", nameEn: "Setif" },
  { id: 20, code: "20", nameAr: "سعيدة", nameFr: "Saïda", nameEn: "Saida" },
  { id: 21, code: "21", nameAr: "سكيكدة", nameFr: "Skikda", nameEn: "Skikda" },
  { id: 22, code: "22", nameAr: "سيدي بلعباس", nameFr: "Sidi Bel Abbès", nameEn: "Sidi Bel Abbes" },
  { id: 23, code: "23", nameAr: "عنابة", nameFr: "Annaba", nameEn: "Annaba" },
  { id: 24, code: "24", nameAr: "قالمة", nameFr: "Guelma", nameEn: "Guelma" },
  { id: 25, code: "25", nameAr: "قسنطينة", nameFr: "Constantine", nameEn: "Constantine" },
  { id: 26, code: "26", nameAr: "المدية", nameFr: "Médéa", nameEn: "Medea" },
  { id: 27, code: "27", nameAr: "مستغانم", nameFr: "Mostaganem", nameEn: "Mostaganem" },
  { id: 28, code: "28", nameAr: "المسيلة", nameFr: "M'Sila", nameEn: "M'Sila" },
  { id: 29, code: "29", nameAr: "معسكر", nameFr: "Mascara", nameEn: "Mascara" },
  { id: 30, code: "30", nameAr: "ورقلة", nameFr: "Ouargla", nameEn: "Ouargla" },
  { id: 31, code: "31", nameAr: "وهران", nameFr: "Oran", nameEn: "Oran" },
  { id: 32, code: "32", nameAr: "البيض", nameFr: "El Bayadh", nameEn: "El Bayadh" },
  { id: 33, code: "33", nameAr: "إليزي", nameFr: "Illizi", nameEn: "Illizi" },
  { id: 34, code: "34", nameAr: "برج بوعريريج", nameFr: "Bordj Bou Arréridj", nameEn: "Bordj Bou Arreridj" },
  { id: 35, code: "35", nameAr: "بومرداس", nameFr: "Boumerdès", nameEn: "Boumerdes" },
  { id: 36, code: "36", nameAr: "الطارف", nameFr: "El Tarf", nameEn: "El Tarf" },
  { id: 37, code: "37", nameAr: "تندوف", nameFr: "Tindouf", nameEn: "Tindouf" },
  { id: 38, code: "38", nameAr: "تيسمسيلت", nameFr: "Tissemsilt", nameEn: "Tissemsilt" },
  { id: 39, code: "39", nameAr: "الوادي", nameFr: "El Oued", nameEn: "El Oued" },
  { id: 40, code: "40", nameAr: "خنشلة", nameFr: "Khenchela", nameEn: "Khenchela" },
  { id: 41, code: "41", nameAr: "سوق أهراس", nameFr: "Souk Ahras", nameEn: "Souk Ahras" },
  { id: 42, code: "42", nameAr: "تيبازة", nameFr: "Tipaza", nameEn: "Tipaza" },
  { id: 43, code: "43", nameAr: "ميلة", nameFr: "Mila", nameEn: "Mila" },
  { id: 44, code: "44", nameAr: "عين الدفلى", nameFr: "Aïn Defla", nameEn: "Ain Defla" },
  { id: 45, code: "45", nameAr: "النعامة", nameFr: "Naâma", nameEn: "Naama" },
  { id: 46, code: "46", nameAr: "عين تموشنت", nameFr: "Aïn Témouchent", nameEn: "Ain Temouchent" },
  { id: 47, code: "47", nameAr: "غرداية", nameFr: "Ghardaïa", nameEn: "Ghardaia" },
  { id: 48, code: "48", nameAr: "غليزان", nameFr: "Relizane", nameEn: "Relizane" },
  { id: 49, code: "49", nameAr: "المغير", nameFr: "El M'Ghair", nameEn: "El M'Ghair" },
  { id: 50, code: "50", nameAr: "المنيعة", nameFr: "El Meniaa", nameEn: "El Meniaa" },
  { id: 51, code: "51", nameAr: "أولاد جلال", nameFr: "Ouled Djellal", nameEn: "Ouled Djellal" },
  { id: 52, code: "52", nameAr: "برج باجي مختار", nameFr: "Bordj Badji Mokhtar", nameEn: "Bordj Badji Mokhtar" },
  { id: 53, code: "53", nameAr: "بني عباس", nameFr: "Béni Abbès", nameEn: "Beni Abbes" },
  { id: 54, code: "54", nameAr: "تيميمون", nameFr: "Timimoun", nameEn: "Timimoun" },
  { id: 55, code: "55", nameAr: "تقرت", nameFr: "Touggourt", nameEn: "Touggourt" },
  { id: 56, code: "56", nameAr: "جانت", nameFr: "Djanet", nameEn: "Djanet" },
  { id: 57, code: "57", nameAr: "عين صالح", nameFr: "In Salah", nameEn: "In Salah" },
  { id: 58, code: "58", nameAr: "عين قزام", nameFr: "In Guezzam", nameEn: "In Guezzam" },
] as const;

/** Approximate wilaya centroids, used only to place map markers when a
 *  contributor did not share precise coordinates. */
export const WILAYA_CENTROIDS: Record<number, [number, number]> = {
  1: [27.87, -0.29], 2: [36.17, 1.33], 3: [33.8, 2.86], 4: [35.87, 7.11],
  5: [35.55, 6.17], 6: [36.75, 5.08], 7: [34.85, 5.73], 8: [31.62, -2.21],
  9: [36.47, 2.83], 10: [36.37, 3.9], 11: [22.79, 5.53], 12: [35.4, 8.12],
  13: [34.88, -1.32], 14: [35.37, 1.32], 15: [36.71, 4.05], 16: [36.75, 3.06],
  17: [34.67, 3.26], 18: [36.82, 5.77], 19: [36.19, 5.41], 20: [34.83, 0.15],
  21: [36.88, 6.91], 22: [35.19, -0.64], 23: [36.9, 7.75], 24: [36.46, 7.43],
  25: [36.37, 6.61], 26: [36.26, 2.75], 27: [35.93, 0.09], 28: [35.7, 4.54],
  29: [35.4, 0.14], 30: [31.95, 5.33], 31: [35.7, -0.64], 32: [33.68, 1.02],
  33: [26.48, 8.47], 34: [36.07, 4.76], 35: [36.77, 3.48], 36: [36.77, 8.31],
  37: [27.67, -8.15], 38: [35.61, 1.81], 39: [33.37, 6.87], 40: [35.44, 7.14],
  41: [36.29, 7.95], 42: [36.59, 2.45], 43: [36.45, 6.26], 44: [36.26, 1.97],
  45: [33.27, -0.31], 46: [35.3, -1.14], 47: [32.49, 3.67], 48: [35.74, 0.56],
  49: [33.95, 5.92], 50: [30.58, 2.88], 51: [34.42, 5.06], 52: [21.33, 0.95],
  53: [30.13, -2.17], 54: [29.26, 0.23], 55: [33.11, 6.06], 56: [24.55, 9.48],
  57: [27.19, 2.47], 58: [19.57, 5.77],
};

export const WILAYA_BY_CODE = new Map(WILAYAS.map((w) => [w.code, w]));
export const WILAYA_BY_ID = new Map(WILAYAS.map((w) => [w.id, w]));

export function wilayaName(w: { nameAr: string; nameFr: string; nameEn: string }, locale: string) {
  return locale === "ar" ? w.nameAr : locale === "fr" ? w.nameFr : w.nameEn;
}
