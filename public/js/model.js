/* ==========================================
   SERAJ AL-AHSA - MVC MODEL LAYER
   الستوري بورد البصري والتصور السينمائي للرحلة الغامرة
   ========================================== */

window.App = window.App || {};

App.Model = class {
  constructor() {
    this.currentLanguage = "ar";
    this.currentStation = 1;
    this.booksSelection = [true, false, true];

    // State of ambient sound and email export
    this.state = {
      ambient_audio: false,
      nfc_linked: false,
      email_exported: false
    };

    // Translations Dictionary
    this.translations = {
      ar: {
        langLabel: "English",
        mainTitle: "سِـرَاج الأَحْـسَـاء",
        subTitle: "الستوري بورد البصري والتصور السينمائي للرحلة الغامرة",
        intro: "المقدمة",
        map: "خريطة التجربة",
        storyboard: "الستوري بورد",
        badge: "الستوري بورد والتصور التنفيذي",
        heroTitle: "الستوري بورد البصري: معايشة رحلة الحواس السبعة",
        heroDesc: "رؤية بصرية وسينمائية متكاملة تستعرض كواليس التجربة الشعورية والهندسية لمشروع «سراج الأحساء». هنا نأخذك في جولة سينمائية متسلسلة توثق ماذا يرى ويسمع ويشعر به الزائر في كل محطة، وصولاً إلى أدق التفاصيل التقنية والميزانية التنفيذية.",
        enterLab: "استكشاف الستوري بورد الحي",
        stationsNum: "07",
        stationsLbl: "مشاهد حسية غامرة",
        laserNum: "20K",
        laserLbl: "لومينز ليزر مضاد للماء",
        domeNum: "360°",
        domeLbl: "سينما قبابية رباعية الأبعاد",
        mapTitle: "المخطط التفاعلي لمسار الحواس السبعة (خريطة التدفق)",
        mapDesc: "انقر على أي محطة بالخريطة للتنقل السريع واستعراض مشهدها البصري ومواصفاتها الهندسية والمالية",
        selStation: "اختر مشهد المحطة",
        activeSim: "معايشة بصرية وحسية",
        
        // Tabs
        tabScenario: "المشهد البصري والسردي",
        tabTech: "التجهيزات والمواصفات الهندسية",
        tabPlan: "الخطة الإنشائية ومراحل التنفيذ",
        tabFinance: "الميزانية التقديرية والجدول الزمني",

        // Senses Labels
        visualSens: "بصري",
        auditorySens: "سمعي",
        tactileSens: "لمسي",
        olfactorySens: "شمي",
        hapticSens: "اهتزاز/حركة",
        digitalSens: "السوار الذكي",
        audioEngine: "المؤثرات الصوتية والبيئية",

        // Actions
        successMsg: "تم إرسال الملفات والمخطوطات لبريدك بنجاح!",
        exportBtn: "تصدير الباقة التاريخية",
        emailPlaceholder: "example@domain.com",
        activeVal: "نشط",
        inactiveVal: "خامل",
        onVal: "تشغيل",
        offVal: "إيقاف",
        interactiveVal: "تفاعلي",
        copyright: "مشروع سِـرَاج الأَحْـسَـاء © 2026. جميع الحقوق محفوظة.",
        
        // Financial Translations
        financeLbl: "الموازنة التقديرية وجدول التنفيذ",
        currency: "ريال سعودي",
        durationLbl: "المدة الزمنية المتوقعة للتنفيذ",
        costLbl: "البند التقني / الإنشائي",
        costValLbl: "التكلفة التقديرية",
        totalLbl: "إجمالي الميزانية للمحطة"
      },
      en: {
        langLabel: "العربية",
        mainTitle: "SERAJ AL-AHSA",
        subTitle: "Visual Storyboard & Cinematic Experience Flow",
        intro: "Introduction",
        map: "Experience Map",
        storyboard: "Storyboard",
        badge: "Visual Storyboard & Executive Scenario",
        heroTitle: "Visual Storyboard: The 7 Senses Immersive Journey",
        heroDesc: "A comprehensive cinematic visualization detailing the emotional and engineering narrative of 'Seraj Al-Ahsa'. Walk through a sequential spatial storyboard capturing what visitors see, hear, and feel at every station, complete with technical specifications and budget breakdowns.",
        enterLab: "Explore Visual Storyboard",
        stationsNum: "07",
        stationsLbl: "Immersive Sensory Stations",
        laserNum: "20K",
        laserLbl: "Waterproof Laser Lumens",
        domeNum: "360°",
        domeLbl: "4D Dome Projection",
        mapTitle: "The 7 Senses Spatial Map (Experience Flow)",
        mapDesc: "Click on any station on the map to navigate and inspect its visual narrative, engineering specs, and financial breakdown",
        selStation: "Select Station Scene",
        activeSim: "Visual & Sensory Immersion",
        
        // Tabs
        tabScenario: "Visual Scene & Narrative",
        tabTech: "Technical Specs & Engineering",
        tabPlan: "Construction Plan & Phases",
        tabFinance: "Budget & Implementation Schedule",

        // Senses Labels
        visualSens: "Visual",
        auditorySens: "Auditory",
        tactileSens: "Tactile",
        olfactorySens: "Olfactory",
        hapticSens: "Haptic/Kinetic",
        digitalSens: "Smart RFID",
        audioEngine: "Generative Audio & Soundscapes",

        // Actions
        successMsg: "Historical manuscripts and documents sent successfully!",
        exportBtn: "Export Heritage Bundle",
        emailPlaceholder: "example@domain.com",
        activeVal: "Active",
        inactiveVal: "Inactive",
        onVal: "ON",
        offVal: "OFF",
        interactiveVal: "Interactive",
        copyright: "Seraj Al-Ahsa Project © 2026. All Rights Reserved.",
        
        // Financial Translations
        financeLbl: "Estimated Budget & Execution Schedule",
        currency: "SAR",
        durationLbl: "Estimated Execution Duration",
        costLbl: "Technical / Structural Item",
        costValLbl: "Estimated Cost",
        totalLbl: "Total Station Budget"
      }
    };

    // Experience Stations Data Sheet (Storyboard, Senses, Specs, Plans, Finance)
    this.stations = {
      1: {
        title: {
          ar: "ساحة الوصول والتهيئة الاستراتيجية",
          en: "Arrival Courtyard & Strategic Alignment"
        },
        tagline: {
          ar: "بوابة الماء والضوء: أولى خطوات العبور من الحاضر إلى عمق هجر",
          en: "The Gateway of Water & Light: First steps crossing from the present into ancient Hajar"
        },
        image: "assets/storyboard/station1.jpg",
        imageAlt: {
          ar: "التصور البصري لساحة الوصول وشلال الليزر المائي الذكي",
          en: "Visual Concept of Arrival Plaza & Smart Hydro-Laser Curtain"
        },
        icon: "fa-water",
        sensesRating: {
          visual: "95%",
          sound: "85% (خرير مياه هادئ)",
          smell: "40% (رذاذ طبيعي)",
          touch: "60% (استلام السوار)",
          haptic: "10%",
          digital: "100% (تسجيل RFID)"
        },
        scenario: {
          ar: "يخطو الزائر داخل بوابة طينية عملاقة مهجنة معمارياً؛ تنعزل عنه ضوضاء العالم الخارجي ليحل محلها صوت خرير ماء هادئ ينساب من سقف زجاجي معلق. شلال مائي ذكي يسقط بدقة فائقة مشكّلاً عبارات ترحيبية بالخط الحجازي القديم عبر أشعة ليزرية مخفية. يتسلم الزائر «سوار السراج الذكي» لتبدأ إضاءة الأرضية بالتوهج بمسار دليلي يقوده نحو بوابة الزمن.",
          en: "The visitor steps into an architectural hybrid mud-brick gateway, instantly insulated from outside noise by the tranquil sound of falling water from a suspended glass ceiling. A smart water curtain drops with extreme precision, forming welcome phrases in ancient Hijazi calligraphy illuminated by concealed laser beams. The visitor receives the 'Seraj Smart Bracelet', triggering a glowing directional floor guide."
        },
        keyHighlights: {
          ar: [
            "عزل صوتي كامل عن العالم الخارجي فور الدخول",
            "شلال مائي رقمي ذكي يكتب بالخط العربي على القطرات",
            "تسليم سوار السراج الذكي لربط تجربة الزائر التفاعلية",
            "مسارات إضاءة ذكية موجهة تقود الحركة بسلاسة"
          ],
          en: [
            "Complete acoustic isolation upon entry",
            "Smart digital water curtain writing Arabic vector text on drops",
            "Issuance of Seraj Smart Bracelet syncing the visitor journey",
            "Interactive guidance floor lighting leading movement seamlessly"
          ]
        },
        tech: {
          ar: "• مضخات مائية رقمية ذات صمامات نفاثة (Laminar Jets) لقطع المياه بدقة عالية.\n• أنظمة إسقاط ضوئي ليزري بقوة 20,000 لومينز مضادة للماء والرطوبة (IP65).\n• رقاقات تعريف لاسلكية (RFID/NFC) مدمجة بالأساور التفاعلية الموزعة في المدخل.\n• إضاءة تفاعلية موجهة ومزودة بمجسات حضور وضغط لتفعيل مسارات الضوء الأرضية.",
          en: "• Digital water pumps with fast-acting Laminar Jets cutting streams with high precision.\n• 20,000 Lumens waterproof and moisture-resistant laser projectors (IP65 rating).\n• Wireless identification chips (RFID/NFC) embedded in custom smart visitor bracelets.\n• Interactive directed floor lighting, tied to presence sensors, forming the guidance pathway."
        },
        plan: {
          ar: "الخطة التنفيذية لبوابة الماء الذكية (محطة 1):\n• التوصيف العام: يتم بناء مجسم حقيقي لبوابات هجر التراثية باستخدام مواد طينية معالجة للرطوبة ومدعمة بالخرسانة والحديد المقاوم للصدأ.\n• التركيبات المائية: تأسيس خزان مياه سفلي مغلق مزود بنظام تنقية وفلترة مستمر، ومضخات غاطسة سريعة الاستجابة وصمامات Solenoid لقطع وسقوط قطرات الماء بشكل رقائقي (Laminar Flow).\n• نظام الليزر والبرمجيات: دمج أجهزة إسقاط ليزري DMX بقوة 20,000 لومينز ذات موجات طولية خضراء وزرقاء لكتابة الخطوط العربية على شلال المياه المتدفق.\n• نظام السوار التفاعلي: تركيب قارئ RFID/NFC مدمج بقوس البوابة لتسجيل الدخول التفاعلي للزائر برمز فريد يربط كافة تفاعلاته داخل المتحف.\n• خطوات التنفيذ الهندسي:\n  1. مرحلة الحفر وتجهيز مجاري المياه الأرضية المعزولة بمادة الإيبوكسي.\n  2. تشييد الأعمدة والكتلة الخرسانية للبوابات الطينية ومعالجتها بمواد مقاومة لملوحة المياه والرطوبة.\n  3. تركيب رؤوس الشلال المائي وصمامات النفاثات الذكية واختبار معدل التدفق.\n  4. تثبيت ومعايرة مصادر الليزر فوق البوابات وبرمجة برنامج الإسقاط لربط الجسيمات المائية بكتابات الخط الحجازي.\n  5. تركيب قارئات الـ RFID وبرمجة مسارات الإضاءة التوجيهية بالأرضيات.",
          en: "Implementation Plan for Smart Water Gate (Station 1):\n• General Description: A physical monument of Hajar's heritage gateways is built using moisture-treated clay supported by reinforced concrete and rustproof steel.\n• Hydraulic Layout: Subterranean water tank equipped with continuous filtration, high-speed pumps, and Solenoid valves generating precision laminar flow streams.\n• Laser Calligraphy: Mount waterproof DMX laser project units (20k lumens) to paint Arabic words onto the water curtain.\n• RFID Integration: Embed desktop-grade RFID/NFC scanners inside the entrance archway to register visitor bands.\n• Construction Milestones:\n  1. Excavation and waterproofing of ground drainage reservoirs.\n  2. Erection of mud-textured concrete columns, treated with humidity blockers.\n  3. Installation of laminar water curtain manifolds and testing volume flow rates.\n  4. Mounting laser projection systems overhead and programming graphic vector fonts.\n  5. Deploying RFID gateway readers and wiring floor guide LED channels."
        },
        finance: {
          duration: { ar: "10 أسابيع (شهران ونصف)", en: "10 Weeks (2.5 Months)" },
          items: [
            { label: { ar: "صمامات نفاثة ومضخات غاطسة ونظام فلترة ذكي للمياه", en: "Laminar Jets, Pumps & Water Filtration System" }, cost: 250000 },
            { label: { ar: "أجهزة عرض ليزرية IP65 قوة 20K لومينز ومعاير الضوء", en: "IP65 Laser Projectors 20K Lumens & Optical Calibrators" }, cost: 450000 },
            { label: { ar: "بوابة ذكية مدمجة بقارئ RFID وأساور تفاعلية (1000 وحدة)", en: "Smart Gate RFID Reader & 1000 Interactive Wristbands" }, cost: 80000 },
            { label: { ar: "الأعمال الطينية والمدنية والهياكل المقاومة للرطوبة والصدأ", en: "Mud Masonry, Civil Engineering & Rustproof Supports" }, cost: 150000 },
            { label: { ar: "رسم الخطوط المتجهية وتطوير واجهات الربط البرمجية للموقع", en: "Vector Calligraphy Software & MVC API Integrations" }, cost: 90000 }
          ]
        }
      },
      2: {
        title: {
          ar: "ممر رحلة الزمن (أعماق هجر)",
          en: "Time Corridor (Hajar Depths)"
        },
        tagline: {
          ar: "الانحدار نحو التاريخ: رمال تفاعلية، عبق التوابل، وطرق القوافل القديمة",
          en: "Descending into History: Interactive sand, spice aromas, and ancient caravan trails"
        },
        image: "assets/storyboard/station2.jpg",
        imageAlt: {
          ar: "التصور البصري لممر رحلة الزمن والأرضية التفاعلية",
          en: "Visual Concept of Time Corridor & Interactive Sand Floor"
        },
        icon: "fa-hourglass-half",
        sensesRating: {
          visual: "90% (جدران تفاعلية)",
          sound: "75% (أصوات القوافل والأسواق)",
          smell: "85% (عبق الزعفران واللبان)",
          touch: "80% (رمال حقيقية رقيقة)",
          haptic: "30% (انحدار الممر)",
          digital: "70% (تتبع خطى LiDAR)"
        },
        scenario: {
          ar: "ينحدر الزائر في ممر حلزوني مهيب؛ تنخفض الإضاءة تدريجياً لتهيئ الحواس، وتفوح رائحة التوابل واللبان واللؤلؤ القديم. مع كل خطوة يخطوها، تتفاعل الأرضية المصنوعة من شاشات LED مغطاة بطبقة رملية رقيقة منقى، مظهرةً حركة قوافل افتراضية تتنحى عن خطاه، بينما تنبض الجدران الجانبية برسومات حية متدفقة تحكي قصة أسواق هجر التاريخية قبل الإسلام وميناء العقير وحصن المشقر.",
          en: "Descending into a grand spiral corridor, ambient light dims to calibrate the senses while the fragrance of frankincense, saffron, and pearls fills the air. With every step, the weight-bearing LED floor covered with a thin layer of purified desert sand reacts, parting virtual caravan footprints beneath the visitor. The side walls come alive with moving graphics depicting pre-Islamic Hajar markets, Aqeer port, and Al-Mushaqqar fort."
        },
        keyHighlights: {
          ar: [
            "أرضية LED تفاعلية مغطاة برمال طبيعية نقية مع حساسات LiDAR",
            "ضخ روائح تراثية جافة (لبان، زعفران، توابل شرقية)",
            "إسقاط بانورامي على الجدران يروي خطوط التجارة وموقع هجر الإقليمي",
            "انتقال شعوري تدريجي من الصخب الحديث إلى سكون التاريخ"
          ],
          en: [
            "Interactive LED floor coated with real sand and LiDAR foot tracking",
            "Automated diffusion of heritage dry-mist aromas (frankincense, saffron)",
            "Panoramic wall mapping tracing ancient trade routes and Hajar markets",
            "Gradual emotional transition into historical tranquility"
          ]
        },
        tech: {
          ar: "• شاشات تفاعلية أرضية تتحمل الأوزان وضغط الحركة الشديد (Heavy-Duty Interactive LED Floor).\n• مستشعرات مسح وحركة ليزرية تعمل بالأشعة تحت الحمراء لتتبع خطى الزوار (LiDAR Sensors).\n• نظام توزيع عطري ميكانيكي ذكي يضخ رذاذ الروائح الطبيعية الجافة عبر فتحات التهوية المخفية.\n• أجهزة إسقاط عالية التباين لعرض الطرق التجارية والأسواق التاريخية على الجدران الطينية.",
          en: "• Heavy-duty weight-bearing LED floor screens designed for high visitor footfall.\n• Infrared LiDAR scanning sensors tracking visitor footsteps in real-time.\n• Smart dry-mist scent diffusion integrated into concealed architectural vents.\n• Ultra-high-contrast wall projectors depicting historical trade routes on mud walls."
        },
        plan: {
          ar: "الخطة التنفيذية لممر رحلة الزمن (محطة 2):\n• شاشات الأرضيات تفاعلية: تغطية الأرضية بالكامل ببلاطات شاشات LED شديدة التحمل ومغطاة بطبقة واقية من الزجاج المقسى وحبيبات رملية ناعمة ومنقاة بقطر 1 مم لضمان ملمس طبيعي.\n• أنظمة LiDAR التفاعلية: تركيب مستشعرات ليزرية (LiDAR) في زوايا السقف لرصد إحداثيات خطوات الزوار، وربطها ببرنامج تفاعلي لإزاحة رمال شاشات الـ LED الافتراضية وحركة الإضاءة الدليلية.\n• البنية التحتية العطرية: دمج فوهات ضخ رذاذ جاف متناهي الصغر (Dry Mist) بروائح معبأة بزيت اللؤلؤ الطبيعي والزعفران والهيل لنشر الرائحة فور استشعار مرور الزائر.\n• مراحل التركيب والتنفيذ:\n  1. عزل الصوت والاهتزاز للممر الحلزوني وتأسيس كابلات الطاقة والبيانات للأرضيات.\n  2. تركيب بلاطات الـ LED الأرضية المقواة وتغطيتها بطبقة الزجاج الواقية وحبيبات الرمل.\n  3. تثبيت مستشعرات LiDAR في السقف والقيام بعملية المعايرة الهندسية لمطابقة خطوات الزوار بالإحداثيات الرسومية للمحاكاة.\n  4. تركيب أجهزة العطور والتحكم في كثافتها وسرعة استجابتها مع حركة المرور.",
          en: "Implementation Plan for Time Corridor (Station 2):\n• Interactive LED Floor: Install heavy-duty LED floor panels shielded by tempered glass and coated with 1mm purified desert sand.\n• LiDAR Tracking Engine: Mount ceiling LiDAR sensors mapping visitor coordinates to compute real-time sand-brushing visual feedback.\n• Scent Infrastructure: Integrate micro-nozzles linked to automated dispensers diffusing saffron and frankincense.\n• Deployment Phases:\n  1. Acoustic insulation of the ramp and laying high-bandwidth data channels.\n  2. Fitting heavy-duty LED modules and tempered glass sand layer.\n  3. Calibrating LiDAR cameras for precise visitor footstep registration.\n  4. Deploying automated aroma delivery vents."
        },
        finance: {
          duration: { ar: "12 أسبوعاً (3 أشهر)", en: "12 Weeks (3 Months)" },
          items: [
            { label: { ar: "بلاطات شاشات LED أرضية تفاعلية تتحمل الأوزان (30 متر مربع)", en: "Weight-bearing Heavy-Duty Interactive LED Floor (30 sq m)" }, cost: 480000 },
            { label: { ar: "طبقة الحماية من الزجاج المقسى وحبيبات الرمل النقي المعالج", en: "Tempered Glass Shielding & Purified Desert Sand Coatings" }, cost: 70000 },
            { label: { ar: "مستشعرات ليزر سقفية LiDAR وحواسب معالجة الإحداثيات", en: "Ceiling LiDAR Scanning Array & Interactive Render Nodes" }, cost: 120000 },
            { label: { ar: "أنظمة التوزيع العطري الميكانيكي بروائح الزعفران وزيت اللؤلؤ", en: "Dry-Mist Aroma Dispensers & Pearl/Spices Extract Refills" }, cost: 60000 },
            { label: { ar: "أجهزة بروجيكتورات جدارية وتطوير سيناريوهات أسواق هجر القديمة", en: "Wall Projection Systems & Pre-Islamic Markets Interactive App" }, cost: 180000 }
          ]
        }
      },
      3: {
        title: {
          ar: "جناح عصر الرسالة والتحول العظيم",
          en: "Dawn of Message & The Great Transformation"
        },
        tagline: {
          ar: "إشراقة النور: هولوجرام رسالة النبي ﷺ وصوت الحق في شرق الجزيرة",
          en: "The Dawn of Light: Floating Hologram of the Prophetic Letter & Directional Acoustic Isolation"
        },
        image: "assets/storyboard/station3.jpg",
        imageAlt: {
          ar: "التصور البصري لهولوجرام كتاب النبوة العائم",
          en: "Visual Concept of Floating 3D Prophetic Letter Hologram"
        },
        icon: "fa-envelope-open-text",
        sensesRating: {
          visual: "100% (هولوجرام ثلاثي الأبعاد)",
          sound: "95% (صوت بؤري موجه ومعزول)",
          smell: "50% (عود معتق)",
          touch: "20%",
          haptic: "15%",
          digital: "80%"
        },
        scenario: {
          ar: "يدخل الزائر قاعة معتمة بالكامل تمتص 99% من الضوء؛ وفجأة تنبثق حزمة ضوئية ذهبية مهيبة في المنتصف، ليطفو في الهواء هولوجرام ثلاثي الأبعاد فائق الدقة يجسد مخطوطة رسالة النبي ﷺ إلى المنذر بن ساوى. تتركز سماعات الصوت البؤري الموجه على الزائر لتعزله تماماً عن محيطه، حيث يتردد صدى نص الرسالة بصوت وقور ونقي، بينما تتوهج الجدران بخيوط ضياء ليزرية تحاكي انتشار أنوار الإيمان في أرجاء هجر والبحرين.",
          en: "The visitor enters a pitch-black hall treated with light-absorbent coatings. Suddenly, a majestic golden light beam erupts in the center, suspending a high-definition 3D hologram of the Prophet's ﷺ letter to Al-Munzir ibn Sawa in mid-air. Ultrasonic directional speakers isolate the visitor with the solemn recitation of the letter, while side walls trace glowing lines of light symbolizing the dawn of faith across Hajar."
        },
        keyHighlights: {
          ar: [
            "عرض هولوجرامي ثلاثي الأبعاد عائم لمخطوطة الرسالة النبوية الشريفة",
            "صوت بؤري موجه (Parametric Audio) يعزل كل زائر في مساحته الخاصة",
            "إضاءة مسرحية درامية متزامنة بالملي ثانية مع الكلمات الصوتية",
            "توثيق تاريخي علمي لدخول أهل الأحساء في الإسلام طواعية ورغبة"
          ],
          en: [
            "Floating 3D holographic projection of the Prophetic manuscript",
            "Parametric directional sound beams isolating visitor listening pods",
            "Dramatic DMX lighting synced at millisecond level with audio recitation",
            "Documented scholarly narrative of Al-Ahsa's peaceful embracing of Islam"
          ]
        },
        tech: {
          ar: "• أجهزة عرض هولوغرام مروحية شبكية ثلاثية الأبعاد سريعة الدوران (Holofan Elite Series).\n• سماعات الصوت الموجه البؤري (Directional Audio Speakers) لعزل التجربة صوتياً لكل بقعة وقوف.\n• إضاءة مسرحية ديناميكية ذكية (DMX) متوافقة بالكامل مع توقيت المؤثرات الصوتية وهولوغرام الرسالة.\n• مولدات ليزر هادئة منخفضة التردد لعرض شبكة الضوء المنتشرة على الجدران.",
          en: "• High-speed holographic display fan arrays (Holofan Elite Series) generating 3D visuals.\n• Ultrasonic directional focal speakers isolating the auditory narrative.\n• DMX-controlled dynamic theater lighting synchronized with the voiceover track.\n• Low-frequency laser emitters tracing glowing lines along wall boundaries."
        },
        plan: {
          ar: "الخطة التنفيذية لعصر الرسالة (محطة 3):\n• تقنيات الهولوغرام المجسم: تثبيت مروحة هولوغرام ثلاثية الأبعاد (Holofan) في قفص عرض مركزي مرتفع ومغطى بالزجاج المعتم غير العاكس، لعرض مخطوطة الرسالة النبوية تطفو وتتحرك في الهواء.\n• هندسة الصوت الموجه: استخدام سماعات بؤرية بالموجات فوق الصوتية (Parametric Sound Beams) يتم توجيهها عمودياً نحو نقطة وقوف محددة، بحيث يسمع الواقف فقط الرسالة دون تداخل الأصوات في الغرفة.\n• المؤثرات الضوئية المعتمة: دهان جدران القاعة بدهان أسود مطفأ يمتص 99% من الضوء لمنع الانعكاسات، مع تمرير خطوط ليزرية ذات تردد آمن ومنخفض القوة تحاكي خطوط الضياء.\n• مراحل التركيب والتنفيذ:\n  1. عزل الضوء والإنارة وتغطية القاعة بمواد ماصة للصوت والضوء.\n  2. تركيب مروحة الهولوغرام المركزية وضبط ارتفاعها ومعدل الدوران وسرعة الصورة.\n  3. تركيب سماعات الصوت البؤري الموجه واختبار بؤرة الصوت ومعدل عزلها خارج بقعة الوقوف.\n  4. معايرة وبرمجة إضاءة الـ DMX ومولدات الليزر لتتزامن الألوان مع كلمات الرسالة المسموعة.",
          en: "Implementation Plan for Dawn of Message (Station 3):\n• Holographic Projection: Install a high-definition spinning Holofan array in a custom floor-mounted display enclosure finished with anti-reflective glass.\n• Focused Acoustic Isolation: Suspend parametric sound domes directly above visitor standing points.\n• Wall Laser Geometry: Embed low-power laser diodes behind dark wall trim.\n• Deployment Steps:\n  1. Coating room walls with light-absorbent paint and acoustic padding.\n  2. Mounting and configuring the holographic display system.\n  3. Aligning and tuning the directional sound domes.\n  4. Programming DMX show control timelines to sync audio, lighting, and lasers."
        },
        finance: {
          duration: { ar: "8 أسابيع (شهران)", en: "8 Weeks (2 Months)" },
          items: [
            { label: { ar: "مصفوفة مراوح العرض المجسم الهولوغرامية عالية الدقة والقفص المعزز", en: "HD Holographic Spinning Fan Array & Glass Enclosure" }, cost: 160000 },
            { label: { ar: "سماعات الصوت الموجه البؤرية (Parametric Speakers) وتثبيتها", en: "Parametric Directional Audio Speaker Domes & Rigging" }, cost: 90000 },
            { label: { ar: "تأسيس ودهان الجدران بمواد ماصة للإنارة بنسبة 99% (Vantablack style)", en: "Light-absorbing Matte Wall Coatings & Acoustic Panels" }, cost: 50000 },
            { label: { ar: "نظام التحكم المركزي DMX ومولدات خطوط الليزر هادئة التردد", en: "DMX Master Controller & Quiet Low-Frequency Laser Modules" }, cost: 110000 },
            { label: { ar: "النمذجة ثلاثية الأبعاد وتسجيل الأداء الصوتي لمخطوطات رسائل العهد النبوي", en: "3D Manuscript Reconstruction & Voiceover Audio Production" }, cost: 80000 }
          ]
        }
      },
      4: {
        title: {
          ar: "جناح جواثى والعهد الراشدي",
          en: "Jawatha & Rashidun Era Pavilion"
        },
        tagline: {
          ar: "ثاني جمعة في الإسلام: شاشات OLED شفافة، طين الواحة المعطر، وواقع معزز",
          en: "The 2nd Friday in Islam: Transparent OLED screens, fragrant oasis mud, and AR overlay"
        },
        image: "assets/storyboard/station4.jpg",
        imageAlt: {
          ar: "التصور البصري لأقواس مسجد جواثى وشاشات OLED الشفافة",
          en: "Visual Concept of Jawatha Arches & Transparent OLED Screens"
        },
        icon: "fa-mosque",
        sensesRating: {
          visual: "95% (OLED شفاف + واقع معزز)",
          sound: "85% (أذان جواثى وأصوات المصلين)",
          smell: "90% (رائحة المطر وسعف النخيل)",
          touch: "70% (ملمس الطين والجبس)",
          haptic: "20%",
          digital: "85% (تتبع الرؤية التراكبي)"
        },
        scenario: {
          ar: "يقف الزائر أمام أقواس معمارية حقيقية مشيدة من طين الأحساء وسعف نخيلها، تفوح منها رائحة المطر العطرية على التربة. عند النظر عبر شاشات OLED شفافة مدمجة بالأقواس، يرى الزائر مشهداً تراكبياً حياً للصحابة وأهل هجر وهم يقيمون ثاني صلاة جمعة جُمعت في الإسلام بمسجد جواثى، مع تجسيد لمواقف الثبات التاريخية في عهد أبي بكر الصديق ودور الأحساء في الفتوحات الراشدة.",
          en: "The visitor stands before authentic architectural arches constructed from local Al-Ahsa mud and palm straw, diffusing the petrichor scent of fresh rain on soil. Looking through transparent OLED screens embedded inside the arches, a photorealistic AR layer superimposes early Muslims performing the second Friday prayer in Islam at Jawatha Mosque, showcasing historical steadfastness during Abu Bakr's caliphate."
        },
        keyHighlights: {
          ar: [
            "أقواس طينية تراثية مدمجة بشاشات OLED شفافة مقاس 55 بوصة",
            "ضخ روائح عطرية طبيعية لرائحة المطر (Petrichor) وسعف النخيل",
            "إعادة بناء رقمية تاريخية دقيقة لجامع جواثى والصحابة الأوائل",
            "إبراز مكانة الأحساء كأول من ثبت على الإسلام في الردة وثاني جمعة أقيمت"
          ],
          en: [
            "Heritage mud arches housing 55-inch Transparent OLED screens",
            "Organic scent diffusion of natural petrichor rain and palm leaves",
            "Accurate digital historical reconstruction of ancient Jawatha Mosque",
            "Highlighting Al-Ahsa's legacy holding the 2nd Friday prayer in Islamic history"
          ]
        },
        tech: {
          ar: "• شاشات OLED شفافة (Transparent OLED Displays) مدمجة بالهياكل والأقواس الطينية.\n• أنظمة ضخ الروائح الطبيعية المستدامة (Organic Scent Diffusers) لتمثيل رائحة المطر وسعف النخيل.\n• محتوى واقع معزز ثلاثي الأبعاد عالي الدقة مطور بمحركات الألعاب العالمية (Unreal Engine 5).\n• أنظمة معايرة الكاميرا وتتبع الرأس لضمان ثبات زاوية الرؤية التراكبية للزائر.",
          en: "• 55-inch Transparent OLED displays embedded within clay arch structures.\n• Organic scent diffusers utilizing sustainable essential oils of rainfall and palm fibers.\n• High-fidelity 3D Augmented Reality assets built with Unreal Engine 5.\n• Real-time head-tracking and camera calibration to align virtual overlays with physical structures."
        },
        plan: {
          ar: "الخطة التنفيذية لجناح جواثى (محطة 4):\n• شاشات الـ OLED الشفافة: تركيب شاشات عرض شفافة مقاس 55 بوصة بدقة 4K داخل إطارات معدنية مخفية ومندمجة بتجويف الأقواس الطينية المبنية حركياً.\n• البناء والتأثير البيئي: تشييد بوابات وأقواس مصنوعة من خليط الطين المحلي وسعف النخيل الحقيقي، وتوزيع نظام ترطيب ورذاذ مائي دقيق يعيد إنتاج رائحة المطر على الطين المجفف.\n• تصميم محتوى الواقع المعزز: برمجة وبناء نماذج ثلاثية الأبعاد للمصلين والبيئة المحيطة بمسجد جواثى القديم بمحرك Unreal Engine 5، مع تفعيل خاصية معايرة زاوية النظر لضمان التطابق التام بين البيئة الحقيقية والافتراضية.\n• مراحل التركيب والتنفيذ:\n  1. تشييد البنية الطينية والأقواس ودمج حوامل الشاشات وهندستها لتتحمل الرطوبة والاهتزاز.\n  2. تركيب شاشات الـ OLED الشفافة وتوصيلها بأجهزة التحكم بالرسوميات.\n  3. دمج نظام الترطيب ونظام ضخ روائح المطر وسعف النخيل خلف الجدران الطينية.\n  4. ضبط تتبع الحركة ومعايرة إحداثيات المشهد الرسومي ليتراكب تماماً مع الأقواس المادية بمجرد وقوف الزائر.",
          en: "Implementation Plan for Jawatha Pavilion (Station 4):\n• Transparent OLED Integration: Fit 55-inch Transparent OLED panels inside mud columns.\n• Heritage Materials & Olfactory: Fabricate arches from authentic Al-Ahsa mud and palm straw with automated soil humidifiers.\n• AR Overlay Calibration: Sync camera lenses with Unreal Engine 5 rendering scripts representing the early Muslim congregation.\n• Steps of Implementation:\n  1. Masonry work of mud arches and recessing display frames.\n  2. Mounting transparent OLED screens and aligning glass panels.\n  3. Deploying natural clay humidifiers and aromatic dispensers.\n  4. Tuning real-time tracking controllers for accurate visual superposition."
        },
        finance: {
          duration: { ar: "14 أسبوعاً (3.5 أشهر)", en: "14 Weeks (3.5 Months)" },
          items: [
            { label: { ar: "شاشات عرض OLED شفافة مقاس 55 بوصة ذات متانة عالية (3 وحدات)", en: "55-inch Transparent OLED Display Panels (3 units)" }, cost: 360000 },
            { label: { ar: "بناء الأقواس الطينية والأعمال الجبسية التراثية المعززة بالحديد", en: "Authentic Mud-Brick Arch Masonry & Internal Steel Support Structure" }, cost: 110000 },
            { label: { ar: "تطوير بيئة مسجد جواثى والصلوات التاريخية بمحرك Unreal Engine 5", en: "UE5 AR Character Rigging, Historical Clothing & Environment Design" }, cost: 240000 },
            { label: { ar: "كاميرات وحساسات تتبع الرأس والربط الجغرافي المعاير للرؤية المعززة", en: "Head-tracking IR Cameras & Geographic Alignment Sensors" }, cost: 70000 },
            { label: { ar: "موزعات العطور العضوية الذكية (برائحة المطر وسعف النخيل)", en: "Organic Scent Diffusers & Rainfall/Palm Leaf Extracts" }, cost: 40000 }
          ]
        }
      },
      5: {
        title: {
          ar: "واحة الأحساء الحية المفتوحة",
          en: "Al-Ahsa Living Open Oasis"
        },
        tagline: {
          ar: "نبض الواحة الخضراء: قنوات الأفلاج، رذاذ التبريد، وصوت توليدي شرقي",
          en: "Pulse of the Green Oasis: Flowing Aflaj canals, micro-cooling mist, and generative Hijaz melody"
        },
        image: "assets/storyboard/station5.jpg",
        imageAlt: {
          ar: "التصور البصري لواحة الأحساء الحية وغابة النخيل",
          en: "Visual Concept of Al-Ahsa Living Oasis & Palm Biome"
        },
        icon: "fa-tree",
        sensesRating: {
          visual: "90% (نخيل وإضاءة نهارية/ليلية)",
          sound: "90% (صوت توليدي للعود وخرير الماء)",
          smell: "75% (رائحة النخيل والماء العذب)",
          touch: "85% (مياه الأفلاج ورذاذ التبريد)",
          haptic: "10%",
          digital: "75% (كاميرات استشعار الكثافة)"
        },
        scenario: {
          ar: "ينتقل الزائر إلى فناء مفتوح ومظلل بأشجار النخيل الباسقة؛ مياه الأفلاج تجري في قنوات أرضية مكشوفة تمنح المكان برودة طبيعية وانتعاشاً حسياً. يعمل نظام صوتي توليدي ذكي يدمج خرير المياه بنغمات العود والقانون الحجازي، ليتغير الإيقاع تلقائياً بحسب كثافة حركة الزوار، مشكلاً بيئة ملهمة وواحة استراحة مهيأة للاستماع إلى الرواة ومحطة للضيافة الأحسائية العريقة.",
          en: "The visitor transitions into an open courtyard shaded by towering palm trees. Crystal waters flow through authentic ground Aflaj channels, providing natural cooling and sensory rejuvenation. A generative audio engine blends water acoustics with dynamic Oud and Qanun melodies on the Hijaz scale, modulating tempo based on visitor crowd density, creating a serene gathering space for heritage storytellers."
        },
        keyHighlights: {
          ar: [
            "شبكة قنوات أفلاج مائية جارية بنظام تدوير وترشيح مغلق",
            "نظام صوتي توليدي (Generative Audio) يعزف تفاعلياً مع حركة الزوار",
            "تبريد مناخي ذكي بالرذاذ الخفي عالي الضغط (1000 PSI)",
            "إضاءة ذكية تحاكي تعاقب أوقات اليوم (الشروق، الضحى، الغسق)"
          ],
          en: [
            "Flowing open Aflaj water channels running on a closed filtration loop",
            "Generative audio algorithm dynamically composing Oud melodies based on occupancy",
            "Microclimate high-pressure mist cooling (1000 PSI)",
            "Dynamic lighting simulating natural daylight cycles (Dawn, Dusk, Night)"
          ]
        },
        tech: {
          ar: "• نظام صوتي توليدي (Generative Audio System) يدمج خرير المياه بالموسيقى الفلكلورية تفاعلياً.\n• هندسة مناخية تعتمد على التبريد بالرذاذ الخفي الموجه والمبرد وجريان مياه جداول الفلج السطحية.\n• إضاءة طبيعية متحكم بها ديناميكياً لتناسب فترات اليوم المتعاقبة (النهار، الغسق، الليل).\n• كاميرات استشعار حراري لتحديد الكثافة العددية وتغذية نظام الصوت التوليدي بالمعطيات.",
          en: "• Generative audio algorithm blending natural water acoustics with traditional folk scales.\n• Micro-climate engineering combining high-pressure misting lines and flowing surface Aflaj channels.\n• Dynamic lighting automation recreating daylight cycles.\n• Thermal counting cameras analyzing occupancy to feed data to climate and sound controllers."
        },
        plan: {
          ar: "الخطة التنفيذية للواحة المفتوحة (محطة 5):\n• خرير الماء التفاعلي: إنشاء شبكة قنوات مياه (أفلاج) سطحية حقيقية تسري عبر الفناء، مع حساسات تدفق ميكانيكية متصلة بنظام الصوت التوليدي لتغيير نغمات خرير المياه حسب تفاعلات الزوار.\n• تبريد مناخي ذكي: توزيع فوهات تبريد بالرذاذ فائق الدقة (High-pressure misting nozzles) تحت ظلال النخيل، وتتحكم لوحة DMX في كمية الرذاذ حسب درجة الحرارة المرصودة وكثافة الزوار.\n• الصوت الموسيقي التوليدي: برمجة خوارزمية صوتية تقوم بعزف أوتار العود والقانون على مقام الحجاز الشرقي تفاعلياً مع كاميرات استشعار الحركة والكثافة لزيادة الحيوية.\n• مراحل التركيب والتنفيذ:\n  1. تشييد قنوات الأفلاج المائية وتجهيز العزل ومضخات التدوير المغلقة ومقاييس التدفق.\n  2. زراعة النخيل وتثبيت الفتحات المخفية لرذاذ التبريد ونظام معالجة المياه لمنع الانسداد.\n  3. تركيب كاميرات رصد الحركة الحرارية وربطها بنظام الصوت التوليدي.\n  4. معايرة إضاءة الفناء الخارجي الذكية لتنسجم مع الإضاءة الطبيعية لليوم.",
          en: "Implementation Plan for Living Oasis (Station 5):\n• Smart Aflaj Hydraulics: Concrete water channels on closed loop pump systems with flow meters adjusting audio chimes.\n• Microclimate & Cooling: High-pressure brass misting nozzles (1000 PSI) tucked under palm structures.\n• Generative Music Engine: Custom algorithm mapping occupancy counts to generative Hijaz scale notes on Oud and Qanun.\n• Steps of Implementation:\n  1. Construction and waterproofing of ground channels.\n  2. Fitting misting lines, filters, and high-pressure pumps.\n  3. Installing thermal imaging cameras to track occupancy.\n  4. Calibration of light sources mimicking day-to-night transitions."
        },
        finance: {
          duration: { ar: "16 أسبوعاً (4 أشهر)", en: "16 Weeks (4 Months)" },
          items: [
            { label: { ar: "بناء وتشييد شبكة جداول الأفلاج الأرضية المفتوحة بمضخات تدوير مغلقة", en: "Ground Aflaj Concrete Channels, Circulation Pumps & Flow Control" }, cost: 180000 },
            { label: { ar: "أشجار النخيل الحقيقية ونظام التبريد بالرذاذ ذو الضغط العالي 1000 PSI", en: "Aesthetic Landscaping, Palm Trees & High-Pressure Mist Array" }, cost: 220000 },
            { label: { ar: "كاميرات رصد الكثافة والمسح الحراري لتحديد أعداد الزوار بالفناء", en: "Thermal Occupancy Cameras & Grid Processing Server" }, cost: 80000 },
            { label: { ar: "برمجة خوارزمية الصوت التوليدي لمقام الحجاز (العود والقانون)", en: "Generative Audio Engine for Traditional Arabian Instruments" }, cost: 140000 },
            { label: { ar: "نظام إضاءة DMX ذكي لمحاكاة تعاقب حركة الشمس وألوان النهار", en: "DMX Sunlight Cycle Light Rig & Automated Fixtures" }, cost: 150000 }
          ]
        }
      },
      6: {
        title: {
          ar: "السينما القبابية الغامرة وتجربة الـ 4D",
          en: "Fulldome 360° Cinema & 4D Immersion"
        },
        tagline: {
          ar: "التحليق فوق تاريخ هجر: شاشة 360°، أرضية اهتزازية، ورياح العيون الباردة",
          en: "Soaring Above Hajar: 360° Dome screen, kinetic haptic floor, and spring breeze actuators"
        },
        image: "assets/storyboard/station6.jpg",
        imageAlt: {
          ar: "التصور البصري للسينما القبابية 360 درجة وعرض وفادة عبد القيس",
          en: "Visual Concept of 360° Fulldome Cinema & Delegation Narrative"
        },
        icon: "fa-film",
        sensesRating: {
          visual: "100% (شاشة قبابية 360 درجة)",
          sound: "100% (صوت محيطي مكاني 7.1)",
          smell: "70% (نسيم عيون الماء البارد)",
          touch: "80% (رذاذ قطرات العيون)",
          haptic: "95% (منصة أرضية اهتزازية كيناتيكية)",
          digital: "90%"
        },
        scenario: {
          ar: "يدخل الزوار قاعة سينمائية مقببة ومستديرة بالكامل (Fulldome 360°)؛ تهتز الأرضية الكيناتيكية خفيفاً لمحاكاة وقع سنابك الخيول وحركة القوافل المنطلقة من هجر لتأمين الجزيرة. تلتف الشاشة القبابية المحيطية بزاوية 360 درجة لتأخذ الزائر في رحلة طيران افتراضية ملحمية فوق واحة الأحساء وعيونها الكبرى (أم سبعة، الحارة، الجوهرية)، مع هبوب رياح حقيقية باردة ورذاذ ماء خفيف ملامس للوجوه عند تدفق الشلالات المائية.",
          en: "Visitors are seated inside a fully hemispherical 360° Fulldome theater. A kinetic floor platform vibrates subtly to simulate galloping horses and caravans marching from Hajar. The panoramic overhead dome screen wraps around the audience, taking them on an epic aerial flight over Al-Ahsa's ancient palm canopy and major natural springs (Umm Sab'ah, Al-Harrah), accompanied by physical wind gusts and fresh spring water mist."
        },
        keyHighlights: {
          ar: [
            "شاشة قبابية عملاقة 360° بقطر 12 متراً مع 6 بروجكترات ليزرية مدمجة 4K",
            "منصة أرضية اهتزازية كيناتيكية (Tactile Transducers) لمحاكاة حركة الخيول",
            "مؤثرات بيئية 4D (مراوح رياح موجهة، رذاذ ماء عيون بارد متزامن)",
            "نظام صوتي محيطي مكاني 7.1 يغمر القاعة بالكامل"
          ],
          en: [
            "Gigantic 12-meter 360° perforated dome screen with 6x edge-blended 4K laser projectors",
            "Kinetic floating floor platform with sub-bass tactile transducers simulating cavalry charges",
            "4D environmental actuators (centrifugal wind blowers, cold mist nozzles)",
            "7.1 spatial surround sound layout wrapped around the dome interior"
          ]
        },
        tech: {
          ar: "• نظام عرض قبابي متكامل (Fulldome Projection Cinema) بأجهزة ليزرية مدمجة الأطراف.\n• أرضيات اهتزازية منخفضة التردد (Subwoofers & Kinetic Platforms) متزامنة مع شريط الفيديو.\n• محركات ومحفزات بيئية للتحكم بالرياح والرذاذ المائي (4D Effect Actuators) عبر تحكم DMX.\n• نظام صوتي محيطي ثلاثي الأبعاد 7.1 موزّع بشكل متساوٍ حول الهيكل القبابي.",
          en: "• Multi-projector edge-blended Fulldome cinema mapping system with auto-calibration.\n• Weight-bearing kinetic platform floor with low-frequency transducers.\n• 4D environmental actuators comprising high-velocity wind fans and DMX-switched misting heads.\n• 7.1 spatial surround sound layout wrapped symmetrically around the interior dome framework."
        },
        plan: {
          ar: "الخطة التنفيذية للسينما الدائرية (محطة 6):\n• الشاشة القبابية والبروجكترات: تشييد قبة عرض بقطر 12 متراً مصنوعة من ألواح الألمنيوم المثقبة الماصة للصوت، وتثبيت 6 أجهزة عرض ليزرية بدقة 4K مدمجة وموزعة بمحيط القبة لإنشاء صورة بانورامية متصلة ببرمجيات دمج الصور (Blending).\n• الأرضية الاهتزازية: بناء منصة أرضية عائمة مركبة على وسائد اهتزاز كهرومغناطيسية منخفضة التردد (Tactile Transducers) لإنتاج اهتزازات تحاكي ركض الخيول وهزات الفتح الإسلامي.\n• أنظمة الـ 4D المحيطية: تركيب فوهات هواء ومراوح لضخ الرياح بنظام DMX، وموزعات رذاذ ماء العيون الباردة متزامنة هندسياً مع مسار الفضاء الجوي المعروض.\n• مراحل التركيب والتنفيذ:\n  1. تركيب الهيكل المعدني الحامل للقبة الدائرية وعزل الصوت للغرفة الخارجية.\n  2. تثبيت أجهزة الإسقاط الليزري وضبط برنامج الدمج البصري للزوايا.\n  3. تركيب المنصة الاهتزازية واختبار أجهزة الاهتزاز ومنظم التردد الصوتي.\n  4. تثبيت مخارج الهواء والماء وربطها بنظام DMX متزامن بالملي ثانية مع توقيت الفيديو.",
          en: "Implementation Plan for Dome Cinema (Station 6):\n• Fulldome System: Construct a 12-meter perforated aluminum dome screen with 6 edge-blended 4K laser projectors.\n• Haptic Platform: Build a floating floor platform suspended on electromagnetic tactile transducers.\n• 4D Environment Actuators: Install high-velocity centrifugal fans and solenoid water valves connected to DMX controllers.\n• Steps of Implementation:\n  1. Mechanical assembly of dome support rings and acoustic insulation.\n  2. Mounting projectors, installing edge-blending software, and visual calibration.\n  3. Positioning kinetic floor pads and testing frequency responses.\n  4. Integrating misting lines and blowers with main DMX controllers."
        },
        finance: {
          duration: { ar: "20 أسبوعاً (5 أشهر)", en: "20 Weeks (5 Months)" },
          items: [
            { label: { ar: "شاشة قبة مقببة من ألواح الألمنيوم المثقب بقطر 12 متراً مع حوامل التعليق", en: "12-meter Perforated Aluminum Dome Screen & Ceiling Support Rigging" }, cost: 350000 },
            { label: { ar: "6 أجهزة إسقاط ليزرية بدقة 4K وخادم دمج المحتوى البصري (Fulldome Server)", en: "6x 4K Projectors & Fulldome Edge-blending Video Servers" }, cost: 780000 },
            { label: { ar: "منصة الأرضية الاهتزازية الكيناتيكية ومحركات التردد منخفض الاهتزاز", en: "Kinetic Floating Floor Platform & Sub-bass Tactile Transducers" }, cost: 210000 },
            { label: { ar: "محركات ومراوح ضخ الرياح الميكانيكية وبخاخات الرذاذ البارد DMX", en: "Centrifugal Wind Blowers, Water Solenoid Actuators & DMX Switch Relays" }, cost: 120000 },
            { label: { ar: "نظام صوتي محيطي 7.1 وتصوير وإنتاج الفيلم القبابي الطائر بزاوية 360 درجة", en: "7.1 Surround Sound Array & 360° Aerial Film Production/Rendering" }, cost: 540000 }
          ]
        }
      },
      7: {
        title: {
          ar: "مركز المعرفة واستدامة الأثر",
          en: "Knowledge & Archival Center"
        },
        tagline: {
          ar: "تخليد التجربة: طاولات لمس ذكية، هوية السوار الرقمي، وإهداء المخطوطات المعتمدة",
          en: "Immortalizing the Impact: Multi-touch smart desks, RFID profile sync, and certified manuscript gifts"
        },
        image: "assets/storyboard/station7.jpg",
        imageAlt: {
          ar: "التصور البصري لمركز المعرفة وطاولات البحث التفاعلية",
          en: "Visual Concept of Knowledge Hub & Interactive Research Desks"
        },
        icon: "fa-book-open-reader",
        sensesRating: {
          visual: "95% (شاشات لمس 43 بوصة)",
          sound: "60% (مؤثرات لمس رقمية هادئة)",
          smell: "50% (رائحة ورق المخطوطات)",
          touch: "100% (لمس متعدد عالي الاستجابة)",
          haptic: "10%",
          digital: "100% (ربط سحابي وإرسال بريدي)"
        },
        scenario: {
          ar: "يصل الزائر إلى محطة الختام في قاعة هادئة ذات تصميم خشبي راقٍ؛ حيث طاولات البحث والدراسة التفاعلية. بمجرد تقريب «سوار السراج الذكي» من الطاولة، يتعرف النظام تلقائياً على سجل الزائر ومساره، وتفتح شاشته الشخصية لاستعراض ملخص رحلته، مع إمكانية تصفح المخطوطات والكتب المعتمدة من اللجنة العلمية للمشروع، وتحميل باقة معرفية رقمية موثقة تُرسل فوراً إلى بريده الإلكتروني كإهداء ثقافي مستدام.",
          en: "The visitor reaches the culminating station in a quiet, oak-crafted research hall equipped with interactive multi-touch study desks. By tapping the 'Seraj Smart Bracelet' onto the desk, the system instantly identifies the visitor's log, opening a personalized interface summarizing their visit. Visitors can inspect digitized manuscripts and certified scholarly volumes, exporting a commemorative digital heritage package directly to their email."
        },
        keyHighlights: {
          ar: [
            "طاولات خشبية ذكية مدمجة بشاشات لمس متعدد مقاس 43 بوصة بدقة 4K",
            "قارئات RFID/NFC مدمجة تحت زجاج الطاولات للتعرف الفوري على الزائر",
            "سحابة أرشفة رقمية مشفرة تضم مئات الوثائق والمخطوطات المعتمدة",
            "محرك إرسال بريدي فوري (SMTP Relay) لتصدير الهدايا المعرفية للمستفيدين"
          ],
          en: [
            "Smart wooden research desks embedded with 43-inch 4K capacitive touch screens",
            "Under-glass RFID/NFC readers providing instant visitor profile authentication",
            "Encrypted archival cloud hosting verified manuscripts and academic publications",
            "Instant SMTP email dispatch engine delivering digital gift bundles directly to visitor inboxes"
          ]
        },
        tech: {
          ar: "• طاولات تفاعلية تعمل باللمس المتعدد (Multi-touch Smart Tables) ذات زوايا عرض مريحة.\n• نظام ربط سحابي آمن وسريع لقاعدة البيانات والمخطوطات التاريخية (Secure Archival Cloud).\n• برمجيات مخصصة لإدارة وتصدير المحتوى التعليمي للزوار مدمجة بنظام إدارة المحتوى (CMS Integration).\n• قارئ بطاقات RFID/NFC مدمج تحت زجاج الطاولة للتعرف التلقائي على هوية وسجل الزائر.",
          en: "• Multi-touch glass interactive smart study tables with high durability.\n• Secure Archival Cloud repository housing verified digital books and manuscript PDFs.\n• Integrated Content Management System (CMS) compiling visitor logs and email dispatch.\n• Desktop-embedded RFID/NFC antenna coils scanning bracelets under the glass cover."
        },
        plan: {
          ar: "الخطة التنفيذية لمركز المعرفة (محطة 7):\n• طاولات اللمس الذكية: تركيب شاشات تفاعلية تعمل باللمس المتعدد (Capacitive Multi-touch) بمقاس 43 بوصة مدمجة داخل طاولات خشبية مصممة هندسياً لحماية الشاشات وتحمل الاستخدام المكثف.\n• قارئات الـ RFID التحت زجاجية: دمج ملفات استشعار الهوائي لقارئات RFID تحت سطح الطاولة الزجاجي لقراءة بيانات سوار الزائر بمجرد اقترابه ونقل سجله التفاعلي إلى الشاشة.\n• الربط السحابي والبريد الإلكتروني: تطوير بوابة برمجية متصلة بقاعدة بيانات سحابية مشفرة تحوي نسخ المخطوطات الرقمية المعتمدة بصيغة PDF، مع محرك إرسال تلقائي للبريد الإلكتروني (SMTP Relay) لتوصيل الملفات للزائر فور إدخال عنوانه.\n• مراحل التركيب والتنفيذ:\n  1. تصنيع الطاولات الخشبية وتركيب شاشات اللمس والزجاج الواقي المضاد للانعكاس وبصمات الأصابع.\n  2. تركيب قارئات الـ RFID وبرمجة واجهة المستخدم الرسومية للربط الشخصي.\n  3. تهيئة البوابة السحابية وقاعدة البيانات وتغذيتها بالمحتوى العلمي المعتمد.\n  4. برمجة واجهات الاتصال البرمجية (APIs) لإرسال الإهداءات والتحقق من صحة البريد الإلكتروني للزائر.",
          en: "Implementation Plan for Knowledge Center (Station 7):\n• Multi-touch Smart Desks: Embed high-durability 43-inch capacitive touch panels directly inside wooden research benches.\n• Under-Glass RFID Antennas: Position RFID scanning loops directly under the glass surface.\n• Cloud Integration & Email Dispatch: Develop a local gateway server linking requests to an Archival Cloud with SMTP automated email delivery.\n• Steps of Implementation:\n  1. Assembling wooden tables, mounting capacitive screens, and anti-fingerprint glass.\n  2. Installing RFID scanning modules and programming user identification interfaces.\n  3. Setting up cloud databases and populating digital assets.\n  4. Integrating SMTP relay APIs to dispatch materials to visitor emails."
        },
        finance: {
          duration: { ar: "8 أسابيع (شهران)", en: "8 Weeks (2 Months)" },
          items: [
            { label: { ar: "طاولات لمس تفاعلية ذكية مقاس 43 بوصة مصنعة بخشب الزان (3 وحدات)", en: "Capacitive Multi-touch Study Desks 43-inch & Cabinetry (3 units)" }, cost: 190000 },
            { label: { ar: "هوائيات وقارئات RFID/NFC مدمجة تحت الزجاج ومحولات البيانات", en: "Embedded Desktop RFID/NFC Antennas & Controllers" }, cost: 40000 },
            { label: { ar: "تهيئة الخادم السحابي CMS وتطوير قاعدة بيانات المخطوطات والوثائق", en: "Archival Cloud Storage, Database Setup & SMTP Relay Mail Servers" }, cost: 90000 },
            { label: { ar: "رقمنة وأرشفة المخطوطات التاريخية المعتمدة وتصنيف الكتب تعليمياً", en: "Digitization, Scanning & Licensing of Historic Committee Manuscripts" }, cost: 70000 }
          ]
        }
      }
    };
  }

  // Get current translation values
  getTranslations() {
    return this.translations[this.currentLanguage];
  }

  // Set selected station number
  setStation(stationNum) {
    this.currentStation = stationNum;
  }

  // Toggle active language
  toggleLanguage() {
    this.currentLanguage = this.currentLanguage === "ar" ? "en" : "ar";
    return this.currentLanguage;
  }
};
