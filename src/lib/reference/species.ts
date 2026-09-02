/** Reference list of tree species commonly planted in Algeria.
 *  Reference data only — never demo/production content. */
export type SpeciesRef = {
  slug: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  latin: string | null;
};

export const TREE_SPECIES: readonly SpeciesRef[] = [
  { slug: "olive", nameAr: "زيتون", nameFr: "Olivier", nameEn: "Olive", latin: "Olea europaea" },
  { slug: "aleppo-pine", nameAr: "صنوبر حلبي", nameFr: "Pin d'Alep", nameEn: "Aleppo pine", latin: "Pinus halepensis" },
  { slug: "cork-oak", nameAr: "بلوط فليني", nameFr: "Chêne-liège", nameEn: "Cork oak", latin: "Quercus suber" },
  { slug: "holm-oak", nameAr: "بلوط أخضر", nameFr: "Chêne vert", nameEn: "Holm oak", latin: "Quercus ilex" },
  { slug: "atlas-cedar", nameAr: "أرز أطلسي", nameFr: "Cèdre de l'Atlas", nameEn: "Atlas cedar", latin: "Cedrus atlantica" },
  { slug: "eucalyptus", nameAr: "كاليتوس", nameFr: "Eucalyptus", nameEn: "Eucalyptus", latin: "Eucalyptus spp." },
  { slug: "cypress", nameAr: "سرو", nameFr: "Cyprès", nameEn: "Cypress", latin: "Cupressus sempervirens" },
  { slug: "carob", nameAr: "خروب", nameFr: "Caroubier", nameEn: "Carob", latin: "Ceratonia siliqua" },
  { slug: "fig", nameAr: "تين", nameFr: "Figuier", nameEn: "Fig", latin: "Ficus carica" },
  { slug: "date-palm", nameAr: "نخيل", nameFr: "Palmier dattier", nameEn: "Date palm", latin: "Phoenix dactylifera" },
  { slug: "argan", nameAr: "أركان", nameFr: "Arganier", nameEn: "Argan", latin: "Argania spinosa" },
  { slug: "almond", nameAr: "لوز", nameFr: "Amandier", nameEn: "Almond", latin: "Prunus dulcis" },
  { slug: "orange", nameAr: "برتقال", nameFr: "Oranger", nameEn: "Orange", latin: "Citrus sinensis" },
  { slug: "pomegranate", nameAr: "رمان", nameFr: "Grenadier", nameEn: "Pomegranate", latin: "Punica granatum" },
  { slug: "acacia", nameAr: "أكاسيا", nameFr: "Acacia", nameEn: "Acacia", latin: "Acacia spp." },
  { slug: "tamarisk", nameAr: "أثل", nameFr: "Tamaris", nameEn: "Tamarisk", latin: "Tamarix spp." },
  { slug: "jujube", nameAr: "سدر", nameFr: "Jujubier", nameEn: "Jujube", latin: "Ziziphus lotus" },
  { slug: "ash", nameAr: "دردار", nameFr: "Frêne", nameEn: "Ash", latin: "Fraxinus angustifolia" },
  { slug: "poplar", nameAr: "حور", nameFr: "Peuplier", nameEn: "Poplar", latin: "Populus alba" },
  { slug: "willow", nameAr: "صفصاف", nameFr: "Saule", nameEn: "Willow", latin: "Salix alba" },
  { slug: "pistachio-atlas", nameAr: "بطم أطلسي", nameFr: "Pistachier de l'Atlas", nameEn: "Atlas pistachio", latin: "Pistacia atlantica" },
  { slug: "other", nameAr: "نوع آخر", nameFr: "Autre espèce", nameEn: "Other species", latin: null },
] as const;
