import type { Locale } from "@/i18n/config";

export type LegalSection = {
  id: string;
  heading: Record<Locale, string>;
  body: Record<Locale, string[]>;
};

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "collected",
    heading: {
      ar: "البيانات التي نجمعها",
      fr: "Données que nous collectons",
      en: "What we collect",
    },
    body: {
      ar: [
        "عند إنشاء الحساب نجمع الاسم والبريد الإلكتروني وكلمة مرور مُجزّأة، والولاية إن اخترت تحديدها.",
        "عند تسجيل شجرة نحفظ النوع وتاريخ الزراعة والولاية والبلدية، إضافةً إلى صورة وملاحظات إن أضفتها، وإحداثيات تقريبية إن سمحت بذلك.",
      ],
      fr: [
        "À la création du compte : nom, adresse e-mail, mot de passe haché et, si vous la renseignez, votre wilaya.",
        "À l'enregistrement d'un arbre : espèce, date de plantation, wilaya et commune, ainsi qu'une photo et des remarques si vous en ajoutez, et des coordonnées approximatives si vous les autorisez.",
      ],
      en: [
        "When you create an account: your name, email address, a hashed password and, if you provide it, your wilaya.",
        "When you record a tree: species, planting date, wilaya and commune, plus a photo and notes if you add them, and approximate coordinates if you allow it.",
      ],
    },
  },
  {
    id: "location",
    heading: {
      ar: "الموقع الجغرافي",
      fr: "Localisation",
      en: "Location data",
    },
    body: {
      ar: [
        "لا تُعرض إحداثياتك الدقيقة للعموم في أي حال. تُقرَّب المواقع قبل عرضها على الخريطة إلى ما يقارب الكيلومتر، وتُحذف بيانات الموقع من صور الأشجار (EXIF) عند الرفع.",
        "إذا لم تشارك موقعك، تُعرض الشجرة عند المركز التقريبي للولاية.",
      ],
      fr: [
        "Vos coordonnées exactes ne sont jamais publiées. Les positions sont arrondies à environ un kilomètre avant tout affichage sur la carte, et les métadonnées EXIF des photos sont supprimées au téléversement.",
        "Sans partage de position, l'arbre est affiché au centre approximatif de la wilaya.",
      ],
      en: [
        "Your exact coordinates are never published. Positions are rounded to roughly one kilometre before any map display, and EXIF metadata is stripped from photos at upload time.",
        "If you share no location, the tree is shown at the approximate centre of its wilaya.",
      ],
    },
  },
  {
    id: "public",
    heading: {
      ar: "ما يظهر للعموم",
      fr: "Ce qui est public",
      en: "What is public",
    },
    body: {
      ar: [
        "صفحات الأشجار الموثّقة تعرض النوع والتاريخ والولاية والبلدية والموقع التقريبي والصورة إن وُجدت.",
        "لا يُعرض بريدك الإلكتروني ولا هاتفك ولا عنوانك ولا أي بيانات مصادقة. يمكنك إخفاء اسمك عن كل شجرة، أو تعطيل ملفك الشخصي العام كليًا من إعدادات الحساب.",
      ],
      fr: [
        "Les pages d'arbres vérifiés affichent l'espèce, la date, la wilaya, la commune, une position approximative et la photo le cas échéant.",
        "Ni votre e-mail, ni votre téléphone, ni votre adresse, ni aucune donnée d'authentification ne sont affichés. Vous pouvez masquer votre nom pour chaque arbre ou désactiver entièrement votre profil public.",
      ],
      en: [
        "Verified tree pages show the species, date, wilaya, commune, an approximate position and the photo where one exists.",
        "Your email, phone, address and any authentication data are never shown. You can hide your name per tree, or switch your public profile off entirely in account settings.",
      ],
    },
  },
  {
    id: "retention",
    heading: {
      ar: "الاحتفاظ بالبيانات والأمان",
      fr: "Conservation et sécurité",
      en: "Retention and security",
    },
    body: {
      ar: [
        "تُخزَّن كلمات المرور مُجزّأة بخوارزمية scrypt ولا يمكن استرجاعها. تُحفظ الجلسات في قاعدة البيانات وتنتهي صلاحيتها تلقائيًا.",
        "تُسجَّل العمليات الحساسة في سجل عمليات غير قابل للتعديل من طرف التطبيق لأغراض المساءلة.",
      ],
      fr: [
        "Les mots de passe sont hachés avec scrypt et ne peuvent pas être récupérés. Les sessions sont stockées en base et expirent automatiquement.",
        "Les opérations sensibles sont consignées dans un journal d'audit que l'application n'altère jamais après écriture.",
      ],
      en: [
        "Passwords are hashed with scrypt and cannot be recovered. Sessions live in the database and expire automatically.",
        "Sensitive operations are written to an audit log that the application never modifies after the fact.",
      ],
    },
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "nature",
    heading: {
      ar: "طبيعة المنصة",
      fr: "Nature de la plateforme",
      en: "What this platform is",
    },
    body: {
      ar: [
        "الجزائر خضراء منصة رقمية للمساهمة في مبادرات التشجير في الجزائر. هي مبادرة مستقلة وليست جهة حكومية ولا تمثّل أي وزارة أو مؤسسة رسمية، ولا تشكّل سجلًا بيئيًا معتمدًا.",
        "لا تتضمّن المنصة أي تبرعات مالية.",
      ],
      fr: [
        "Algérie Verte est une plateforme numérique de contribution aux initiatives de reboisement en Algérie. C'est une initiative indépendante : elle n'est pas un organisme gouvernemental, ne représente aucun ministère ni institution officielle et ne constitue pas un registre environnemental certifié.",
        "Aucun don monétaire n'est proposé sur la plateforme.",
      ],
      en: [
        "Algeria Green is a digital platform for contributing to tree-planting initiatives in Algeria. It is an independent initiative: it is not a government body, does not represent any ministry or official institution, and is not a certified environmental register.",
        "The platform handles no monetary donations.",
      ],
    },
  },
  {
    id: "accuracy",
    heading: {
      ar: "دقة المساهمات",
      fr: "Exactitude des contributions",
      en: "Accuracy of contributions",
    },
    body: {
      ar: [
        "أنت مسؤول عن صحة ما تسجّله. تُراجع كل شجرة قبل احتسابها ضمن الأرقام العلنية، ويمكن رفض أي تسجيل غير دقيق أو طلب تصحيحه.",
        "قد يؤدي التلاعب المتكرر بالبيانات إلى تعليق الحساب.",
      ],
      fr: [
        "Vous êtes responsable de l'exactitude de ce que vous enregistrez. Chaque arbre est vérifié avant d'entrer dans les chiffres publics ; un enregistrement inexact peut être rejeté ou faire l'objet d'une demande de correction.",
        "Toute falsification répétée peut entraîner la suspension du compte.",
      ],
      en: [
        "You are responsible for the accuracy of what you record. Every tree is reviewed before it enters the public figures; an inaccurate submission can be rejected or sent back for correction.",
        "Repeated falsification may lead to account suspension.",
      ],
    },
  },
  {
    id: "content",
    heading: {
      ar: "المحتوى المرفوع",
      fr: "Contenu téléversé",
      en: "Uploaded content",
    },
    body: {
      ar: [
        "ارفع فقط صورًا تملك حق استخدامها، ولا تتضمّن أشخاصًا يمكن التعرّف عليهم دون موافقتهم. الصيغ المقبولة JPEG وPNG وWebP.",
        "يحق لفريق الإشراف إزالة أي محتوى غير مناسب.",
      ],
      fr: [
        "Ne téléversez que des photos dont vous détenez les droits et qui ne montrent pas de personnes identifiables sans leur accord. Formats acceptés : JPEG, PNG, WebP.",
        "L'équipe de modération peut retirer tout contenu inapproprié.",
      ],
      en: [
        "Upload only photos you have the right to use, and which do not show identifiable people without their consent. Accepted formats: JPEG, PNG, WebP.",
        "The moderation team may remove any inappropriate content.",
      ],
    },
  },
  {
    id: "availability",
    heading: {
      ar: "التوفّر",
      fr: "Disponibilité",
      en: "Availability",
    },
    body: {
      ar: ["تُقدَّم الخدمة كما هي دون ضمان توفّر متواصل. قد تتوقف مؤقتًا لأغراض الصيانة أو التطوير."],
      fr: ["Le service est fourni en l'état, sans garantie de disponibilité continue. Des interruptions de maintenance sont possibles."],
      en: ["The service is provided as-is, with no guarantee of continuous availability. Maintenance interruptions may occur."],
    },
  },
];
