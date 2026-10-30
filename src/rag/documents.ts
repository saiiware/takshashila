// Crochet & Knitting Knowledge Base Documents sourced strictly from data/part1.txt, data/part2.txt, data/part3.txt, and data/part4.txt.

export interface KnowledgeDocument {
  id: string; // e.g. "part-1", "part-2", "part-3", "part-4"
  videoOrder: number;
  title: string;
  marathiTitle: string;
  sourceFile: string;
  content: string;
  summary: string;
  keyTopics: string[];
  starterQuestions: string[];
}

export const PART1_TEXT = `व्हिडिओ १: क्रोशे बेसिक — चेन, सिंगल क्रोशे, हाफ डबल क्रोशे आणि डबल क्रोशे (Part 1: Beginner Crochet Basics by Suchita).

[00:00 - 00:36] Introduction by Suchita:
हॅलो एव्हरीवन, मी आहे सुचिता. मी एक क्रोशे आर्टिस्ट आणि डेंटिस्ट आहे. मी हे YouTube चॅनल सुरू करत आहे. आजचा व्हिडिओ एकदम बिगिनर लोकांसाठी आहे ज्यांना क्रोशे शिकायचं आहे. क्रोशे हा सध्या खूप ट्रेंडिंग आणि एस्थेटिक (Pinterest trending) विषय आहे. तुम्ही छान आणि क्यूट वस्तू बनवू शकता. आज आपण शिकणार आहोत: यान कसे पकडायचे, हुक कोणते वापरायचे, आणि बेसिक स्टिचेस.

[00:37 - 00:57] Materials & Tools Required (साहित्य):
१. यान बॉल (Yarn ball): गंगा कंपनीचा "ऑलिव्हिया" (Ganga Olivia) अक्रिलिक यान (Acrylic yarn). नवशिक्यांनी अक्रिलिक याननेच सुरुवात करावी.
२. क्रोशे हुक (Crochet Hook): यानवर मेन्शन केल्याप्रमाणे ४.५ मिमी (4.5 mm) नंबरची हुक वापरावी. अगदी बारीक हुक वापरल्यास सुरुवातीला कठीण जाईल, म्हणून मोठी हुक (4.5mm) योग्य आहे.
३. कात्री (Scissors): धागा कापण्यासाठी.

[00:58 - 01:47] Holding the Yarn & Making the Starter Loop (यान पकडणे आणि लूप बनवणे):
१. यानचे शेवटचे टोक उजव्या हाताकडे सोडून डाव्या हातावर एक वेढा रोल करून घ्या.
२. उरलेल्या भागाचा एक गोल (सर्कल) बनवा.
३. शेवटचे टोक त्या गोलातून वर काढून ओढून घ्या, ज्यामुळे एक स्लिप नॉट/लूप तयार होईल.
४. या लूपमध्ये ४.५ मिमी हुक इन्सर्ट करा. हुकचे टोक स्वतःकडे (facing you) असावे.
५. डाव्या हाताच्या तीन बोटांमध्ये यान धरून पहिल्या बोटावरून रोल करा, आणि अंगठा व मधल्या बोटाने (thumb and middle finger) लूप पकडून ठेवा.

[01:48 - 02:54] Chain Stitch Technique (चेन स्टिच बनवणे):
१. हुकचे टोक स्वतःकडे आहे.
२. हुकला डाव्या बाजूने (left side) फिरवून यानच्या मागे न्या, जेणेकरून यान हुकवर गुंडाळले जाईल (Yarn Over).
३. हुकच्या टोकाने यान पकडून लूपमधून हळूच बाहेर ओढून काढा. पहिली चेन तयार झाली.
४. हीच क्रिया पुन्हा करा: डावीकडे फिरवा, यान गुंडाळा, लूपमधून बाहेर काढा.
५. अशा प्रकारे सलग १, २, ३, ४, ५, ६, ७, ८ चेन्स बनवून छान चेन तयार करा. घाबरू नका, अगदी सोपे आहे.

[02:55 - 04:13] Single Crochet Stitch (सिंगल क्रोशे - SC):
१. हुक उजव्या हातात धरा. हुकचे टोक स्वतःकडे.
२. चेनच्या वरच्या भागात (upper loop of chain) हुक इन्सर्ट करा.
३. यानचा गुंडाळा करून हुकने धागा बाहेर काढा. आता हुकवर २ लूप्स (2 loops) असतील.
४. पुन्हा हुक मागे नेऊन यान गुंडाळा (Yarn Over) आणि दोन्ही लूप्समधून एकदम बाहेर काढा. हा झाला पहिला सिंगल क्रोशे!
५. प्रत्येक चेनमध्ये हुक घालून २ लूप्स बनवा, मग यान ओढून दोन्हीमधून काढा.

[04:14 - 05:23] Half Double Crochet Stitch (हाफ डबल क्रोशे - HDC):
१. हुकचे टोक स्वतःकडे ठेवा, हुक मागे नेऊन प्रथम यानचा गुंडाळा करा (Yarn Over first).
२. सिंगल क्रोशेच्या वरच्या भागात हुक इन्सर्ट करा.
३. यान पकडून बाहेर ओढा. आता हुकवर ३ लूप्स (3 loops on hook) तयार होतील.
४. पुन्हा यान गुंडाळा आणि एकाच वेळी तिन्ही लूप्समधून (all 3 loops at one time) धागा बाहेर काढा.
५. स्टेप्स: १ (यान ओवर), २ (इन्सर्ट), ३ (बाहेर ओढा - ३ लूप्स), ४ (यान ओवर), ५ (तिन्हीमधून काढा).

[05:24 - 06:44] Double Crochet Stitch (डबल क्रोशे - DC) — 7 Steps:
१. स्टेप १: हुकवर यान गुंडाळा (Yarn Over).
२. स्टेप २: स्टीचमध्ये हुक इन्सर्ट करा.
३. स्टेप ३: धागा ओढून बाहेर काढा (आता हुकवर ३ लूप्स आहेत).
४. स्टेप ४: पुन्हा यान गुंडाळा.
५. स्टेप ५: पहिल्या दोन लूप्समधून धागा बाहेर काढा (आता हुकवर २ लूप्स उरतात).
६. स्टेप ६: पुन्हा यान गुंडाळा.
७. स्टेप ७: उरलेल्या दोन्ही लूप्समधून धागा बाहेर काढा.
अशा ७ स्टेप्समध्ये डबल क्रोशे तयार होतो.

[06:45 - 07:34] Practice Advice & Conclusion (प्रॅक्टिस कशी करावी):
- पहिल्या दिवशी फक्त चेन बनवण्याची सराव करा.
- दुसऱ्या दिवशी सिंगल क्रोशेची प्रॅक्टिस करा.
- व्हिडिओ थांबवून थांबवून बघा आणि स्पीड स्लो करून सोबत ट्राय करा.
- स्टेप्स १ ते ७ लक्षात ठेवा म्हणजे काम सोपे होईल.`;

export const PART2_TEXT = `व्हिडिओ २: क्रोशेने छोटूसा क्यूट हार्ट शेप बनवणे (Part 2: Cute Little Crochet Heart Shape by Suchita - Episode 4 of Shapes Series).

[00:00 - 00:28] Intro & Materials:
हॅलो एव्हरीवन, हा आपला चौथा एपिसोड आहे ज्यामध्ये आपण क्रोशेने विविध शेप्स शिकत आहोत. आज आपण शिकणार आहोत हा छोटूसा आणि क्यूट हार्ट (Heart Shape).
साहित्य:
१. यान: गंगा ऑलिव्हिया (Ganga Olivia yarn).
२. क्रोशे हुक: ४ मिमी (4 mm hook).
३. टेपेस्ट्री नीडल (Tapestry needle) आणि कात्री (Scissors).

[00:29 - 01:13] Magic Ring / Magic Circle (मॅजिक रिंग बनवणे):
१. यानचे शेवटचे टोक उजव्या हातात पकडा.
२. डाव्या आणि उजव्या हातामध्ये यान पकडून एक गोल (circle) फिरवून घ्या.
३. गोलाच्या आत खालून हुक इन्सर्ट करा आणि धागा पकडून वर काढा.
४. पहिल्या बोटावरून यान घेऊन अंगठा व मधल्या बोटाने पकडा.
५. धागा ओढून लूपमधून काढा. आपली मॅजिक रिंग तयार झाली!

[01:14 - 02:28] Chain 3 & 3 Treble Crochets (३ चेन आणि ३ ट्रिपल क्रोशे):
१. मॅजिक रिंगमध्ये ३ चेन बनवा (Chain 1, Chain 2, Chain 3).
२. आता ट्रिपल क्रोशे (Treble Crochet / Tr) बनवायचा आहे:
   - हुकवर दोनदा यान फिरवा (Yarn over twice - हुकवर ३ वेढे येतील).
   - मॅजिक रिंगमध्ये हुक इन्सर्ट करा, धागा ओढा (हुकवर ४ लूप्स).
   - यान ओवर करून पहिल्या २ लूप्समधून काढा (३ लूप्स उरले).
   - यान ओवर करून पुढच्या २ लूप्समधून काढा (२ लूप्स उरले).
   - यान ओवर करून शेवटच्या २ लूप्समधून काढा. पहिला ट्रिपल क्रोशे तयार!
३. असाच दुसरा आणि तिसरा ट्रिपल क्रोशे बनवा. (एकूण: ३ चेन + ३ ट्रिपल क्रोशे).

[02:29 - 03:15] 3 Double Crochets & Bottom Corner Point (३ डबल क्रोशे आणि हार्टचा खालचा टोक):
१. आता ३ डबल क्रोशे (3 Double Crochet) बनवा: पहिला DC, दुसरा DC, आणि तिसरा DC.
२. १ चेन (Chain 1) बनवा.
३. हार्टचा खालचा टोक बनवण्यासाठी १ ट्रिपल क्रोशे (1 Treble Crochet) बनवा.
४. पुन्हा १ चेन (Chain 1) बनवा.

[03:16 - 03:48] Second Half Symmetrical Side (हार्टची दुसरी बाजू):
१. ३ डबल क्रोशे (3 Double Crochet) बनवा.
२. ३ ट्रिपल क्रोशे (3 Treble Crochet) बनवा (दोनदा यान ओवर करून).
३. शेवटी सुरुवातीप्रमाणे ३ चेन (Chain 3) बनवा.

[03:49 - 04:53] Closing Magic Ring & Finishing (मॅजिक रिंग बंद करणे आणि फिनिशिंग):
१. मॅजिक रिंगच्या मध्यभागी १ स्लिप स्टिच (Slip Stitch) करा.
२. मॅजिक रिंगचा सुरुवातीचा धागा घट्ट ओढून घ्या, ज्यामुळे मधला गोल पूर्णपणे बंद होईल.
३. १ चेन करून लॉक करा, एक्स्ट्रा धागा कात्रीने कट करा.
४. टेपेस्ट्री नीडलने पाठीमागच्या टाक्यांमधून धागा ओवून लपवा (weave in ends) आणि फिनिशिंग करा.
सुंदर आणि क्यूट छोटूसा हार्ट तयार झाला!`;

export const PART3_TEXT = `व्हिडिओ ३: क्रोशेने पंचकोन (Pentagon) कसा बनवायचा — ५ बाजू आणि ५ कोपरे (Part 3: Crochet Pentagon Shape by Suchita - Episode 3 of Shapes Series).

[00:01 - 00:26] Intro to Pentagon Shape:
नमस्कार सगळ्यांना, आजच्या व्हिडिओमध्ये आपण शिकणार आहोत हा पंचकोन (Pentagon), ज्याला ५ बाजू (5 sides) आणि ५ कोपरे (5 corners) असतात. हा आपल्या सिरीजचा तिसरा एपिसोड आहे.
साहित्य: गंगा ऑलिव्हिया यान, ४ मिमी हुक, टेपेस्ट्री नीडल आणि सिझर.

[00:27 - 02:59] Round 1: Magic Ring & 5 Corners (राऊंड १):
१. मॅजिक रिंग बनवा.
२. ३ चेन बनवा (Chain 3 - हा पहिला डबल क्रोशे म्हणून काउंट होतो).
३. मॅजिक रिंगमध्ये आणखी २ डबल क्रोशे बनवा (एकूण ३ डबल क्रोशेचा ग्रुप = पहिली बाजू).
४. पहिला कॉर्नर बनवण्यासाठी २ चेन बनवा (Chain 2).
५. परत ३ डबल क्रोशे आणि २ चेन (दुसरी बाजू व कॉर्नर).
६. परत ३ डबल क्रोशे आणि २ चेन (तिसरी बाजू व कॉर्नर).
७. परत ३ डबल क्रोशे आणि २ चेन (चौथी बाजू व कॉर्नर).
८. परत ३ डबल क्रोशे आणि २ चेन (पाचवी बाजू व कॉर्नर).
९. मॅजिक रिंगचा धागा घट्ट ओढून मध्यभाग बंद करा.
१०. सुरुवातीच्या ३ चेन्सपैकी तिसऱ्या चेनमध्ये १ स्लिप स्टिच (Slip Stitch) करून राऊंड १ बंद करा. पंचकोनाचा ५ कॉर्नर्सचा पाया तयार झाला.

[03:00 - 05:28] Round 2: Corner Expansion (राऊंड २):
१. ३ चेन बनवा (पहिला DC). पुढच्या २ डबल क्रोशेवर प्रत्येकी १ DC बनवा (एकूण ३ DC).
२. कॉर्नरच्या जागेवर (Chain-2 space) आल्यावर:
   - १ डबल क्रोशे, २ चेन, आणि त्याच जागेत अजून १ डबल क्रोशे बनवा ([1 DC, 2 ch, 1 DC]). हा नवीन कॉर्नर तयार झाला.
३. पुढच्या ३ डबल क्रोशेवर प्रत्येकी १ डबल क्रोशे बनवा.
४. पुढील कॉर्नरवर पुन्हा [1 DC, 2 ch, 1 DC] करा.
५. अशा प्रकारे सर्व ५ बाजू आणि ५ कॉर्नर्स पूर्ण करा.
६. तिसऱ्या चेनमध्ये स्लिप स्टिच करून राऊंड २ बंद करा.

[05:29 - 07:31] Round 3 & Crucial Rule: Not Skipping the Final DC (राऊंड ३):
१. ३ चेन बनवा, आणि कॉर्नरपर्यंत येणाऱ्या प्रत्येक डबल क्रोशेवर १-१ डबल क्रोशे विणा.
२. प्रत्येक कॉर्नरमध्ये नेहमीप्रमाणे [1 DC, 2 ch, 1 DC] बनवा.
३. बाजूवरील सर्व डबल क्रोशेवर डबल क्रोशे विणा.
४. अत्यंत महत्त्वाची टीप (Crucial Rule): पाचव्या कॉर्नरनंतर स्लिप स्टिच करण्याआधी खाली १ वाढलेला डबल क्रोशे उरतो. तो चुकूनही स्किप (skip) करू नका! जर तो सोडला तर पंचकोनाचा आकार बिघडून जाईल. त्या डबल क्रोशेवर १ DC बनवा आणि मगच सुरुवातीच्या तिसऱ्या चेनमध्ये स्लिप स्टिच करा.

[07:32 - 09:05] Invisible Finishing with Tapestry Needle (फिनिशिंग):
१. १ चेन करून धागा कट करा. मॅजिक रिंगचा धागा अजून थोडा घट्ट ओढून घ्या.
२. टेपेस्ट्री नीडलमध्ये धागा ओवून मागच्या २-३ टाक्यांमधून लपवून (hide) घ्या आणि उरलेला धागा कापा.
३. यामुळे धागा कुठे लपवला हे ओळखूही येत नाही आणि पंचकोनाला एकदम शार्प एजेस मिळतात!`;

export const PART4_TEXT = `व्हिडिओ ४: क्रोशेने षटकोन (Hexagon) कसा बनवायचा — ६ बाजू आणि ६ कोपरे (Part 4: Crochet Hexagon Shape by Suchita - Episode 2 of Shapes Series).

[00:00 - 00:34] Intro to Hexagon Shape:
हॅलो एव्हरीवन, आज आपण शिकणार आहोत हा सुंदर असा षटकोन (Hexagon), ज्याला ६ समान बाजू आणि ६ कोपरे असतात. हा सिरीजचा दुसरा भाग आहे.
साहित्य: गंगा ऑलिव्हिया यान, ४ मिमी हुक (4 mm hook), टेपेस्ट्री नीडल आणि सिझर.

[00:35 - 03:32] Round 1: Magic Ring & 6 Corners (राऊंड १):
१. मॅजिक रिंग बनवा.
२. ३ चेन बनवा (Chain 3 = पहिला डबल क्रोशे).
३. मॅजिक रिंगमध्ये आणखी २ डबल क्रोशे बनवा (एकूण ३ डबल क्रोशे = पहिली बाजू).
४. २ चेन बनवा (Chain 2 = पहिला कॉर्नर).
५. ३ डबल क्रोशे + २ चेन (दुसरा कॉर्नर).
६. ३ डबल क्रोशे + २ चेन (तिसरा कॉर्नर).
७. ३ डबल क्रोशे + २ चेन (चौथा कॉर्नर).
८. ३ डबल क्रोशे + २ चेन (पाचवा कॉर्नर).
९. ३ डबल क्रोशे + २ चेन (सहावा कॉर्नर).
१०. मॅजिक रिंगचा धागा घट्ट ओढून मध्यभाग बंद करा.
११. सुरुवातीच्या ३ चेन्सपैकी तिसऱ्या चेनमध्ये स्लिप स्टिच करा. (६ बाजू व ६ कॉर्नर्स तयार).

[03:33 - 06:13] Round 2: Hexagon Corner Expansion (राऊंड २):
१. ३ चेन बनवा. पुढील २ डबल क्रोशेवर प्रत्येकी १ DC बनवा.
२. कॉर्नरच्या २-चेन गॅपमध्ये: १ डबल क्रोशे, २ चेन, १ डबल क्रोशे ([1 DC, 2 ch, 1 DC]).
३. पुढील ३ डबल क्रोशेवर ३ डबल क्रोशे विणा.
४. पुढील कॉर्नरमध्ये पुन्हा [1 DC, 2 ch, 1 DC] विणा.
५. अशा प्रकारे सर्व ६ बाजूंवर आणि ६ कॉर्नर्सवर हे रिपीट करा.
६. तिसऱ्या चेनमध्ये स्लिप स्टिच करून राऊंड २ बंद करा. षटकोनाला छान शार्प एजेस दिसू लागतात.

[06:14 - 08:14] Round 3 & Crucial Rule: Working the Increased Stitch (राऊंड ३):
१. ३ चेन बनवा, आणि कॉर्नरपर्यंत येणाऱ्या प्रत्येक डबल क्रोशेवर १-१ DC बनवा.
२. प्रत्येक कॉर्नरमध्ये: [1 DC, 2 ch, 1 DC] बनवा.
३. बाजूवरील प्रत्येक DC वर DC विणा.
४. अत्यंत महत्त्वाची टीप (Crucial Rule): सहाव्या कॉर्नरनंतर स्लिप स्टिचच्या आधी राऊंड २ मधील वाढलेला १ डबल क्रोशे उरतो. तो अजिबात सोडू नका किंवा स्किप करू नका! जर तो स्किप केला तर षटकोनाचा आकार बिघडेल. त्यावर १ DC विणा आणि मगच ३ ऱ्या चेनमध्ये स्लिप स्टिच करा.

[08:15 - 09:17] Fastening Off & Neat Finishing (फिनिशिंग):
१. १ चेन करून काट मारा आणि धागा कट करा.
२. टेपेस्ट्री नीडलने दोन्ही धागे (मॅजिक रिंगचा धागा आणि वरचा शेवटचा धागा) मागच्या बाजूने टाक्यांमधून ओवून हाईड करा आणि कट करा.
३. षटकोन पुढून आणि मागून अतिशय फिनिशिंगमध्ये आणि शार्प कोपऱ्यांसह तयार होतो!`;

export const KNITTING_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "part-1",
    videoOrder: 1,
    title: "Part 1: Beginner Crochet Basics — Chain, Single, Half Double & Double Crochet",
    marathiTitle: "भाग १: नवशिक्यांसाठी क्रोशे बेसिक — चेन, सिंगल, हाफ डबल आणि डबल क्रोशे",
    sourceFile: "part1.txt",
    content: PART1_TEXT,
    summary:
      "Comprehensive beginner crochet lesson: holding Ganga Olivia acrylic yarn, using a 4.5mm hook, creating the starter loop, and mastering Chain Stitch, Single Crochet, Half Double Crochet, and Double Crochet (7 steps).",
    keyTopics: [
      "suchita crochet",
      "ganga olivia yarn",
      "acrylic yarn",
      "4.5 mm crochet hook",
      "holding yarn left hand",
      "starter loop",
      "slip knot",
      "chain stitch",
      "चेन स्टिच",
      "single crochet",
      "सिंगल क्रोशे",
      "2 loops on hook",
      "half double crochet",
      "हाफ डबल क्रोशे",
      "hdc",
      "3 loops on hook",
      "double crochet",
      "डबल क्रोशे",
      "dc",
      "7 steps double crochet",
      "practice routine",
      "day 1 chain day 2 single",
    ],
    starterQuestions: [
      "What yarn and hook size is recommended for beginners in Part 1?",
      "How do I make a chain stitch step by step?",
      "What is the difference between single crochet and half double crochet?",
      "How do I do a double crochet using the 7 steps?",
      "चेन स्टिच आणि सिंगल क्रोशे कसा बनवायचा?",
    ],
  },
  {
    id: "part-2",
    videoOrder: 2,
    title: "Part 2: Cute Little Crochet Heart Shape (छोटूसा क्यूट हार्ट)",
    marathiTitle: "भाग २: क्रोशेने छोटूसा क्यूट हार्ट शेप कसा बनवायचा",
    sourceFile: "part2.txt",
    content: PART2_TEXT,
    summary:
      "Episode 4 of shapes series: crocheting a cute heart using Ganga Olivia yarn and a 4mm hook with magic ring, 3 chains, 3 treble crochets, 3 double crochets, bottom point, symmetry, and closing the magic circle.",
    keyTopics: [
      "crochet heart",
      "हार्ट शेप",
      "छोटूसा क्यूट हार्ट",
      "magic ring",
      "मॅजिक रिंग",
      "magic circle",
      "4 mm hook",
      "ganga olivia",
      "chain 3",
      "३ चेन",
      "treble crochet",
      "ट्रिपल क्रोशे",
      "tr",
      "yarn over twice",
      "3 double crochet",
      "३ डबल क्रोशे",
      "heart bottom point",
      "slip stitch",
      "स्लिप स्टिच",
      "pull magic ring tight",
      "tapestry needle finishing",
    ],
    starterQuestions: [
      "What is the exact stitch sequence for making the crochet heart in Part 2?",
      "How do I make a treble crochet (triple crochet) for the heart lobes?",
      "What stitches create the bottom pointed corner of the heart?",
      "How do I close the center hole of the heart tightly?",
      "हार्ट शेप बनवण्यासाठी मॅजिक रिंग आणि ट्रिपल क्रोशे कसा करावा?",
    ],
  },
  {
    id: "part-3",
    videoOrder: 3,
    title: "Part 3: Crochet Pentagon Shape — 5 Sides & 5 Corners (पंचकोन)",
    marathiTitle: "भाग ३: क्रोशेने पंचकोन कसा बनवायचा — ५ बाजू आणि ५ कोपरे",
    sourceFile: "part3.txt",
    content: PART3_TEXT,
    summary:
      "Episode 3 of shapes series: crocheting a 5-sided pentagon over 3 rounds with magic ring, groups of 3 DC and 2 chains, [1 DC, 2 ch, 1 DC] corner expansion, and the crucial rule of not skipping the final DC.",
    keyTopics: [
      "pentagon",
      "पंचकोन",
      "5 sides",
      "५ बाजू",
      "5 corners",
      "५ कोपरे",
      "magic ring",
      "मॅजिक रिंग",
      "round 1 pentagon",
      "5 groups of 3 dc and 2 chains",
      "round 2 corner expansion",
      "1 dc 2 ch 1 dc",
      "round 3 pentagon",
      "crucial rule",
      "do not skip final dc",
      "शेवटचा डबल क्रोशे स्किप करू नका",
      "sharp edges",
      "tapestry needle invisible finish",
    ],
    starterQuestions: [
      "How many groups of stitches are worked into the magic ring for Round 1 of the pentagon?",
      "What is the corner formula for Round 2 and Round 3 of the pentagon?",
      "Why must I not skip the last double crochet before slip stitching in Round 3?",
      "How do I weave in the yarn tails invisibly on the back of the pentagon?",
      "पंचकोन बनवताना कॉर्नर कसा तयार करायचा?",
    ],
  },
  {
    id: "part-4",
    videoOrder: 4,
    title: "Part 4: Crochet Hexagon Shape — 6 Sides & 6 Corners (षटकोन)",
    marathiTitle: "भाग ४: क्रोशेने षटकोन कसा बनवायचा — ६ बाजू आणि ६ कोपरे",
    sourceFile: "part4.txt",
    content: PART4_TEXT,
    summary:
      "Episode 2 of shapes series: crocheting a 6-sided hexagon over 3 rounds with magic ring, 6 groups of 3 DC and 2 chains, [1 DC, 2 ch, 1 DC] corner expansion, and preserving the increased DC before slip stitching.",
    keyTopics: [
      "hexagon",
      "षटकोन",
      "6 sides",
      "६ बाजू",
      "6 corners",
      "६ कोपरे",
      "magic ring",
      "मॅजिक रिंग",
      "round 1 hexagon",
      "6 groups of 3 dc and 2 chains",
      "round 2 hexagon",
      "1 dc 2 ch 1 dc",
      "round 3 hexagon",
      "crucial rule",
      "increased dc after 6th corner",
      "वाढलेला डबल क्रोशे विणणे",
      "symmetrical hexagon",
      "tapestry needle finishing",
    ],
    starterQuestions: [
      "How do I start Round 1 of the hexagon to create 6 distinct corners?",
      "How do the corner spaces work in Round 2 of the hexagon?",
      "What happens if I skip the increased double crochet after the 6th corner?",
      "What hook size and yarn are used for the hexagon in Part 4?",
      "षटकोन विणताना ६ कॉर्नर्स कसे बनवायचे?",
    ],
  },
];

export const GENERAL_STARTER_QUESTIONS: string[] = [
  "How do I do single crochet, half double, and double crochet from Part 1?",
  "How do I crochet the cute heart shape from Part 2?",
  "How do I make the 5-sided pentagon from Part 3?",
  "How do I crochet the 6-sided hexagon from Part 4?",
  "What is the crucial rule about the final stitch in pentagon and hexagon rounds?",
];
