/* Recall Studio — independent offline-first study app. No third-party runtime or requests. */
'use strict';
const STORAGE='recall_studio_v1';
const $=s=>document.querySelector(s);
const uid=()=> 'id_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escAttr=esc;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const mkCard=(term,definition,pinyin='',notes='',id=uid())=>({id,term:String(term),definition:String(definition),pinyin:String(pinyin),notes:String(notes),accepted:'',image:'',starred:false,correct:0,wrong:0,streak:0,ease:2.5,interval:0,due:0,lastReviewed:0});
const bundledChineseClassVocabulary=[["你好","Hello; hi","nǐ hǎo","Common greeting."],["你","You (singular)","nǐ",""],["好","Good, well, fine, okay, nice","hǎo",""],["我","I; me","wǒ",""],["我们","We; us","wǒ men",""],["你们","You (plural); you all","nǐ men",""],["很","Very, quite; often a neutral link before adjectives","hěn",""],["吗","Neutral-tone yes/no question particle","ma","Place at the end of a yes/no question."],["忙","Busy, occupied","máng",""],["不","Not; no","bù","Pronounced bú before a fourth-tone syllable."],["不忙","Not busy","bù máng",""],["身体","Body; physical health","shēn tǐ","From your classroom whiteboard."],["谢谢","Thank you; thanks","xiè xie","From your classroom whiteboard."],["呢","Question particle; what about ...?","ne","Often returns a question to the other person: 你呢？ (And you?)"],["也","Also; too","yě","Usually placed before the verb or adjective phrase."],["一","One; a single","yī","Number."],["二","2; two","èr","Number."],["三","3; three","sān","Number."],["四","4; four","sì","Number."],["五","Five","wǔ","Number."],["六","6; six","liù","Number."],["七","7; seven","qī","Number."],["八","Eight","bā","Number."],["九","9; nine","jiǔ","Number."],["十","10; ten","shí","Number."],["十一","11; eleven","shí yī","Ten plus one."],["十二","12; twelve","shí èr","Ten plus two."],["二十","20; twenty","èr shí","Two tens."],["三十","30; thirty","sān shí","Three tens."],["四十","40; forty","sì shí","Four tens."],["五十","50; fifty","wǔ shí","Five tens."],["六十","60; sixty","liù shí","Six tens."],["七十","70; seventy","qī shí","Seven tens."],["八十","80; eighty","bā shí","Eight tens."],["九十","90; ninety","jiǔ shí","Nine tens."],["百","Hundred; a hundred","bǎi","The unit for hundreds."],["一百","100; one hundred","yì bǎi","When 一 precedes a third-tone syllable, its common spoken tone is fourth."],["们","Plural suffix for pronouns and some people nouns","men","Used after some pronouns to indicate plural."]];
// Generate a complete and correctly spaced, deterministic 1–100 Chinese Numbers library.
const numberDigits=[['',''],['一','yī'],['二','èr'],['三','sān'],['四','sì'],['五','wǔ'],['六','liù'],['七','qī'],['八','bā'],['九','jiǔ']];
const englishUnits=['zero','one','two','three','four','five','six','seven','eight','nine'];
const englishTeens=['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const englishTens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function numberName(n){return n===100?'one hundred':n<10?englishUnits[n]:n<20?englishTeens[n-10]:n%10===0?englishTens[Math.floor(n/10)]:englishTens[Math.floor(n/10)]+'-'+englishUnits[n%10]}
function numberEntry(n){
 if(n===100)return ['一百','100; one hundred','yì bǎi','Counting number.'];
 if(n<10)return [numberDigits[n][0],n+'; '+numberName(n),numberDigits[n][1],'Counting number.'];
 const tens=Math.floor(n/10),ones=n%10;
 const cn=(tens===1?'十':numberDigits[tens][0]+'十')+(ones?numberDigits[ones][0]:'');
 const py=(tens===1?'shí':numberDigits[tens][1]+' shí')+(ones?' '+numberDigits[ones][1]:'');
 return [cn,n+'; '+numberName(n),py,'Counting number.'];
}
const completeNumberRows=Array.from({length:100},(_,i)=>numberEntry(i+1));
const knownNumberTerms=new Set(completeNumberRows.map(x=>x[0]));
const numberDeckTitle='Chinese Numbers — Class Notes';
const chineseNumberDeck=()=>({id:uid(),title:numberDeckTitle,description:'Every number from 1 to 100. Automatically shuffled for each session.',folder:'Mandarin',subject:'Languages',lang:'zh-CN',randomAlways:true,created:Date.now(),cards:completeNumberRows.map(([term,meaning,pinyin,notes])=>mkCard(term,meaning,pinyin,notes))});
function reconcileNumberLibrary(state){
 const num=state.decks.find(d=>d.title===numberDeckTitle)||state.decks.find(d=>/Chinese|Mandarin/i.test(d.title||'')&&/Number/i.test(d.title||''));
 let dest=num;
 if(!dest){dest=chineseNumberDeck();state.decks.push(dest)}
 dest.randomAlways=true;
 const own=new Map((dest.cards||[]).map(c=>[String(c.term||'').trim(),c]));
 for(const d of state.decks){if(d.id===dest.id||!/Chinese|Mandarin|中文|汉语|漢語/i.test(String(d.title||'')))continue;
  d.cards=(d.cards||[]).filter(c=>{
   let term=String(c.term||'').trim();if(!knownNumberTerms.has(term))return true;
   if(!own.has(term)){own.set(term,c)}else if(own.get(term)!==c){const keep=own.get(term);if((c.correct||0)+(c.wrong||0)>(keep.correct||0)+(keep.wrong||0))own.set(term,c)}
   for(const ev of state.mistakeLog||[]){if(ev.cardId===c.id)ev.deckId=dest.id}
   return false;
  });
 }
 // Keep the unit 百 in the Chinese word library, not in the 1–100 number sequence.
 const chineseVocab=state.decks.find(d=>d.title==='Chinese Vocabulary — Class Notes');
 const cent=(dest.cards||[]).find(c=>c.term==='百');
 if(cent&&chineseVocab&&!chineseVocab.cards.some(c=>c.term==='百'))chineseVocab.cards.push(cent);
 const previous=(dest.cards||[]).filter(c=>c.term==='百');
 const result=[];
 for(const [term,definition,pinyin,notes] of completeNumberRows){
  let card=own.get(term)||mkCard(term,definition,pinyin,notes);
  card.pinyin=pinyin;
  // Preserve user-written meanings and learning history on existing numbered cards.
  if(!String(card.definition||'').trim())card.definition=definition;
  normalizeChineseCard(card);
  result.push(card);
 }
 dest.cards=result;
}
function splitChineseNumbersOnce(state){
 const sources=state.decks.filter(d=>/Chinese|Mandarin|中文|汉语|漢語/i.test(String(d.title||''))&&/Vocabulary|Vocab|Class Notes|词汇|詞彙|Words/i.test(String(d.title||''))&&!/Number/i.test(String(d.title||'')));
 if(!sources.length)return;
 let dest=state.decks.find(d=>/Chinese|Mandarin|中文|汉语|漢語/i.test(String(d.title||''))&&/Number|数字|數字/i.test(String(d.title||'')));
 const movingIds=new Set(),moved=[];
 for(const source of sources){const keep=[];
  for(const card of source.cards||[]){
   if(knownNumberTerms.has(String(card.term||'').trim())){moved.push(card);movingIds.add(card.id)}
   else keep.push(card);
  }
  source.cards=keep;
  if(source.title==='Chinese Vocabulary — Class Notes')source.description='Beginner Mandarin vocabulary from your lessons, excluding numbers.';
 }
 if(!moved.length)return;
 if(!dest){dest={id:uid(),title:'Chinese Numbers — Class Notes',description:'Your number vocabulary from earlier Chinese lessons.',folder:'Mandarin',subject:'Languages',lang:'zh-CN',created:Date.now(),cards:[]};state.decks.push(dest)}
 const present=new Set(dest.cards.map(c=>String(c.term||'').trim()));
 for(const card of moved){let term=String(card.term||'').trim();if(!present.has(term)){dest.cards.push(card);present.add(term)}}
 // Mistake events follow the same physical card as it moves between sets.
 for(const event of state.mistakeLog||[]){if(movingIds.has(event.cardId))event.deckId=dest.id}
}
// Chinese flashcards show optional Pinyin hints on the front; their reverse is
// Pinyin first, English meaning second. This doesn't enable audio by itself.
const chineseTermPattern=/[\u3400-\u9fff\uf900-\ufaff]/u;
function chineseCardParts(card){
 let pinyin=String(card.pinyin||'').trim(),meaning=String(card.definition||'').trim();
 const match=meaning.match(/^([a-zA-ZÀ-žĀ-žüÜ\u0300-\u036f\s']+)\s+[—–-]\s+(.+)$/u);
 if(match&&looksLikePinyin(match[1])){
   if(!pinyin)pinyin=match[1].trim();
   meaning=match[2].trim();
 }else if(pinyin){
   const prefix=pinyin.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   try{meaning=meaning.replace(new RegExp('^'+prefix+'\\s*[—–-]\\s*','iu'),'')}catch(_){/* retain original meaning */}
 }
 return {pinyin,meaning};
}
function isChineseCard(card){return !!card&&chineseTermPattern.test(String(card.term||''))}
function studyChineseParts(card){
 const parts=chineseCardParts(card);
 if(!parts.pinyin){const row=bundledChineseClassVocabulary.find(x=>x[0]===String(card.term||'').trim());if(row)parts.pinyin=row[2]||'';}
 return parts;
}
// A single source of truth for optional Chinese Pinyin hints across study modes.
// Extra Pinyin hints use this helper in every study mode; backs always show Pinyin.
function pinyinHintHtml(card,cssClass='pinyin',visibleChinese=true){
 if(!data.settings.showPinyin||!visibleChinese||!card||!isChineseCard(card))return '';
 const reading=studyChineseParts(card).pinyin;
 return reading?`<div class="${cssClass}" data-pinyin-hint="true">${esc(reading)}</div>`:'';
}
function setShowPinyin(enabled){
 const pending=[];
 if(ui.page==='test'){
  for(const el of document.querySelectorAll('#test-form [name^="a_"]')){
   if(el.type==='radio'){
    if(el.checked)pending.push({name:el.name,type:'radio',value:el.value});
   }else pending.push({name:el.name,type:el.type,value:el.value});
  }
 }
 data.settings.showPinyin=Boolean(enabled);
 save();render();
 if(pending.length){
  for(const entry of pending){
   const els=document.getElementsByName(entry.name);
   for(const el of els){
    if(entry.type==='radio')el.checked=el.value===entry.value;
    else el.value=entry.value;
   }
  }
 }
 toast('Pinyin '+(data.settings.showPinyin?'on':'off'));
}
function pinyinForShownAnswer(text,deck=getDeck()){
 if(!data.settings.showPinyin||!deck)return '';
 const card=deck.cards.find(c=>isChineseCard(c)&&String(c.term||'').trim()===String(text||'').trim());
 return card?pinyinHintHtml(card,'answer-pinyin'):'';
}
function chineseBackHtml(card){
 const p=studyChineseParts(card);
 return `<div class="chinese-reverse"><div class="chinese-reading">${esc(p.pinyin||'Pinyin not entered')}</div><div class="chinese-meaning">${esc(p.meaning||card.definition||'')}</div></div>`;
}
function flashFrontText(card){return isChineseCard(card)?card.term:promptText(card)}

function looksLikePinyin(text){
 const v=String(text||'').trim();
 if(!v||v.length>90||!/[a-zA-Z\u00c0-\u024f\u0300-\u036f]/u.test(v))return false;
 if(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/iu.test(v))return /^[\p{L}\p{M}\s'’]+$/u.test(v);
 // Most common neutral-tone syllables; never mistake generic English phrases for Pinyin.
 return /^(?:ma|men|ne|de|le|ge|me|ba|a|xi[e]?xie)(?:\s+(?:ma|men|ne|de|le|ge|me|ba|a))?$/iu.test(v);
}
function normalizeChineseCard(card){
 if(!isChineseCard(card))return card;
 const canonical={"谢谢":["xièxie","xiè xie"],"我们":["wǒmen","wǒ men"],"你们":["nǐmen","nǐ men"],"身体":["shēntǐ","shēn tǐ"]};
 const replacement=canonical[String(card.term||'').trim()];
 if(replacement&&(!String(card.pinyin||'').trim()||String(card.pinyin||'').trim()===replacement[0]))card.pinyin=replacement[1];
 const m=String(card.definition||'').match(/^(.+?)\s+[—–-]\s+([\s\S]+)$/u);
 if(m&&looksLikePinyin(m[1])){
   if(!String(card.pinyin||'').trim())card.pinyin=m[1].trim();
   card.definition=m[2].trim();
 }
 return card;
}

const chineseNotesDeck=()=>({id:uid(),title:"Chinese Vocabulary — Class Notes",description:"Previous beginner words from your classes, with number cards in their own set.",folder:"Mandarin",subject:"Languages",lang:"zh-CN",created:Date.now(),cards:bundledChineseClassVocabulary.filter(([term])=>!knownNumberTerms.has(term)).map(([term,definition,pinyin,notes])=>mkCard(term,definition,pinyin,notes))});
// One-time upgrade: merge into an existing Mandarin vocabulary deck without changing
// its study stats, starred words, custom definitions or other cards.
// The imported flag means deleting the notes later does NOT resurrect them.
function addChineseClassNotes(state){
 const ranked=state.decks.map(d=>{const title=String(d.title||''), lang=String(d.lang||''),folder=String(d.folder||'');const chinese=/Chinese|Mandarin|中文|汉语|漢語/i.test(title),vocabulary=/Vocabulary|Vocab|Words|词汇|詞彙/i.test(title);
   return {d,score:(chinese&&vocabulary?100:0)+(lang.startsWith('zh')?25:0)+(chinese?15:0)+(/Mandarin|Chinese/i.test(folder)?6:0)};
 }).filter(x=>x.score>=20).sort((a,b)=>b.score-a.score);
 let deck=ranked[0]?.d;
 if(!deck){deck=chineseNotesDeck();state.decks.push(deck);return {created:true,added:deck.cards.length}}
 const previousDefaults={"你":"You (singular)","好":"Good; well; fine; okay; nice","你好":"Hello; hi","我":"I; me","很":"Very; quite","忙":"Busy","不":"Not; no","我们":"We; us","你们":"You (plural); you all","吗":"Yes/no question particle","一":"1; one","五":"5; five","八":"8; eight"};
 const currentMeanings=new Map(bundledChineseClassVocabulary.map(([term,meaning])=>[term,meaning]));
 for(const card of deck.cards){
  const term=String(card.term||'').normalize('NFC').trim();
  if(previousDefaults[term]&&String(card.definition||'')===previousDefaults[term])card.definition=currentMeanings.get(term);
 }
 for(const c of deck.cards){const knownRow=bundledChineseClassVocabulary.find(row=>row[0]===String(c.term||'').normalize('NFC').trim());if(knownRow&&!String(c.pinyin||'').trim())c.pinyin=knownRow[2];normalizeChineseCard(c)}
 const known=new Set(deck.cards.map(c=>String(c.term||'').normalize('NFC').trim()));
 let added=0;
 for(const [term,meaning,pinyin,notes] of bundledChineseClassVocabulary){
   if(known.has(term.normalize('NFC').trim()))continue;
   deck.cards.push(mkCard(term,meaning,pinyin,notes));known.add(term.normalize('NFC').trim());added++;
 }
 if(!deck.lang||!deck.lang.startsWith('zh'))deck.lang='zh-CN';
 return {created:false,added};
}
// User-provided vocabulary is a local study set, with definitions preserved verbatim.
const bundledEnglishVocabulary=[["Cortège","A solemn procession, especially for a funeral"],["Elegy","A poem of serious reflection, typically a lament for the dead"],["Epitaph","A phrase or form of words written in memory of a person who has died"],["Filicide","Killing of one's son or daughter"],["Foeticide","Destruction or abortion of a foetus"],["Fratricide","Killing of one's brother or sister"],["Genocide","Killing of a large group of people"],["Homicide","Killing of one person by another"],["Infanticide","Killing of infants"],["Interment","Burial of a corpse in a grave or tomb"],["Matricide","Killing of one's mother"],["Mortuary","A room or building in which dead bodies are kept"],["Obituary","A news article that reports the recent death of a person"],["Parricide","Killing of a parent or other near relative"],["Patricide","Killing of one's father"],["Post-mortem","An examination of a dead body to determine the cause of death"],["Regicide","Action of killing a king"],["Sororicide","Killing of one's sister"],["Suicide","Act of intentionally causing one's own death"],["Uxoricide","Killing of one's wife"],["Abdication","An act of abdicating or renouncing the throne"],["Almanac","An annual calendar with astronomical/statistical data"],["Amphibian","A cold-blooded vertebrate born in water"],["Allegory","A story revealing hidden meaning (moral/political)"],["Axiom","A statement on which a structure is based"],["Belligerent","A nation/person in war recognized by law"],["Biopsy","Examination of tissue from body to detect disease"],["Blasphemy","Speaking sacrilegiously about sacred things"],["Chronology","Arrangement of events/dates in order"],["Crusade","Campaign for political/social/religious change"],["Ephemeral","Lasting a very short time"],["Extempore","Spoken or done without preparation"],["Exonerate","Release from duty or obligation"],["Gregarious","Fond of company"],["Indelible","Marks that cannot be removed"],["Infallible","Incapable of making mistakes"],["Inevitable","Certain to happen"],["Nostalgia","Sentimental longing for the past"],["Panacea","Remedy for all difficulties/diseases"],["Pantheism","Doctrine identifying God with universe"],["Pedantic","Concerned with minor details/rules"],["Plagiarism","Copying someone else's work"],["Potable","Safe to drink"],["Regalia","Royal emblems/insignia"],["Sacrilege","Misuse of what is regarded as sacred"],["Sinecure","Position requiring little/no work with benefits"],["Souvenir","Reminder of person/place/event"],["Utopia","Ideal society free of suffering"],["Venial","Sin not depriving soul of divine grace"],["Verbatim","In exactly same words"],["Acrophobia","Extreme or irrational fear of heights"],["Aerophobia","Irrational fear of fresh air or drafts"],["Autophobia","Fear of being egotistical, alone or isolated"],["Algophobia","Fear of pain"],["Altophobia","Abnormal fear of heights"],["Anorexia","Obsessive desire to lose weight by refusing to eat"],["Agoraphobia","Fear of open/public places"],["Bathophobia","Persistent fear of depths"],["Bibliophobia","Hatred of books"],["Cacophobia","Fear of ugliness"],["Centrophobia","Dislike of being in the centre"],["Cellophobia","Fear about beauty"],["Chronophobia","Fear of time"],["Cynophobia","Fear of dogs"],["Claustrophobia","Fear of confined places"],["Demonomania","Delusion of being possessed by evil spirits"],["Dipsophobia","Fear of drinking alcohol"],["Ergophobia","Fear of work/employment"],["Gamophobia","Fear of marriage or commitment"],["Genophobia","Fear of sexual relations/intercourse"],["Geraphobia","Fear of old age"],["Gnosiophobia","Fear of knowledge"],["Gynaephobia","Fear of women"],["Graphophobia","Fear of writing/handwriting"],["Hodophobia","Fear of travel"],["Hedonophobia","Aversion to obtaining pleasure"],["Haemetophobia","Fear of disease"],["Logophobia","Obsessive fear of words"],["Menemophobia","Fear of wind or drafts"],["Nyctophobia","Fear of darkness/night"],["Pharmacophobia","Fear of medication"],["Thanatophobia","Fear of death"],["Triskaidekaphobia","Superstition about number 13"],["Anarchy","A state of disorder due to absence or non-recognition of authority or other controlling systems"],["Aristocracy","A form of government in which power is held by the nobility"],["Autocracy","A system of government by one person with absolute power"],["Autonomy","A self-governing country or region"],["Bureaucracy","A system of government in which most of the important decisions are taken by state officials rather than by elected representatives"],["Democracy","A system of government by the whole population or all the eligible members of a state, typically through elected representatives"],["Gerontocracy","A state, society, or group governed by old people"],["Kakistocracy","A state or country run by the worst, least qualified, or most unscrupulous citizens"],["Neocracy","Government by new or inexperienced hands"],["Ochlocracy","Government by the populace"],["Oligarchy","A small group of people having control of a country or organisation"],["Plutocracy","Government by the wealthy"],["Secular","Government not connected with religious or spiritual matters"],["Monarchy","A form of government with a monarch at the head"],["Thearchy","A political system based on government of men by God"],["Archives","A collection of historical documents or records providing information about a place, institution, or group of people"],["Aviary","A large cage, building, or enclosure for keeping birds in"],["Abattoir","A building where animals are butchered"],["Apiary","A place where bees are kept; a collection of beehives"],["Aquarium","A building containing tanks of live fish of different species"],["Arena","A place or scene of activity, debate, or conflict"],["Arsenal","A collection of weapons and military equipment"],["Asylum","An institution for the care of people who are mentally ill"],["Burrow","A hole or tunnel dug by a small animal, especially a rabbit, as a dwelling"],["Casino","A public room or building where gambling games are played"],["Cemetery","A large burial ground, especially one not in a churchyard"],["Cloakroom","A room in a public building where outdoor clothes or luggage may be left"],["Crematorium","A place where a dead person's body is cremated"],["Convent","A Christian community of nuns living together under monastic vows"],["Creche","Nursery where babies and young children are cared for during the working day"],["Decanter","A stoppered glass container into which wine or spirit is decanted"],["Dormitory","A large bedroom for a number of people in a school or institution"],["Drey","The nest of a squirrel, typically in the form of a mass of twigs in a tree"],["Gymnasium","A room or building equipped for gymnastics, games, and other physical exercise"],["Granary","A storehouse for threshed grain"],["Hangar","A large building with an extensive floor area, typically for housing aircraft"],["Hutch","A box or cage, typically with a wire mesh front, for keeping rabbits or other small domesticated animals"],["Infirmary","A place in a large institution for the care of those who are ill"],["Kennel","A small shelter for a dog"],["Lair","A place where wild animals live"],["Mint","A place where coins, medals, or tokens are made"],["Menagerie","A collection of wild animals kept in captivity for exhibition"],["Monastery","A building or buildings occupied by a community of monks living under religious vows"],["Morgue","A place where bodies are kept for identification"],["Orchard","A piece of enclosed land planted with fruit trees"],["Reservoir","A large natural or artificial lake used as a source of water supply"],["Scullery","A small kitchen or room at the back of a house used for washing dishes and another dirty household work"],["Sheath","A close-fitting cover for the blade of a knife or sword"],["Sanatorium","A room or building for sick children in a boarding school"],["Tannery","A place where animal hides are tanned"],["Wardrobe","A large, tall cupboard in which clothes may be hung or stored"],["Agnostic","One who is not sure about God's existence"],["Arsonist","A person who deliberately sets fire to a building"],["Amateur","One who does a thing for pleasure and not as a profession"],["Ambidextrous","One who can use either hand with ease"],["Auditor","One who makes an official examination of accounts"],["Anarchist","A person who believes in or tries to bring about a state of lawlessness"],["Apostate","A person who has changed his faith"],["Atheist","One who does not believe in the existence of God"],["Arbitrator","A person appointed by two parties to solve a dispute"],["Ascetic","One who leads an austere life"],["Bohemian","An unconventional style of living"],["Cacographer","One who is bad in spellings"],["Cannibal","One who feeds on human flesh"],["Chauvinist","A person blindly devoted to an idea or exaggerated patriotism"],["Connoisseur","A critical judge of any art and craft"],["Contemporaries","Persons living at the same time"],["Convalescent","One who is recovering health after illness"],["Coquette","A girl/woman who flirts with man"],["Cosmopolitan","A person who regards the whole world as his country"],["Cynosure","One who is a centre of attraction"],["Cynic","One who sneers at the beliefs of others"],["Demagogue","A leader or orator for the cause of common people"],["Debonair","A person having a sophisticated charm"],["Dilettante","A dabbler in art, science, and literature"],["Epicure","One who is for pleasure of eating and drinking"],["Egotist","One who often talks of his achievements"],["Emigrant","Someone who leaves one country to settle in another"],["Effeminate","A man who is womanish in his habits"],["Fastidious","One hard to please (very selective)"],["Fugitive","One who runs away from justice"],["Fanatic","One filled with religious enthusiasm"],["Fatalist","One who believes in fate"],["Gourmet","A lover of good food"],["Honorary","Conferred as an honour"],["Heretic","A person who acts against religion"],["Highbrow","A person of erudite tastes"],["Hypochondriac","A patient with imaginary symptoms"],["Henpeck","A person controlled by his wife"],["Indefatigable","One who shows tireless enthusiasm"],["Iconoclast","One who attacks traditional ideas"],["Introvert","One who does not express freely"],["Immoral","One who behaves without moral principles"],["Impregnable","A person incapable of being tampered with"],["Insolvent","One who is unable to pay debts"],["Lunatic","A person who is mentally ill"],["Misanthrope","A person who dislikes humankind"],["Mercenary","A person concerned with money over ethics"],["Narcissist","Someone in love with himself"],["Numismatist","One who collects coins as a hobby"],["Philogynist","A person who likes or admires women"],["Philanthropist","A lover of mankind"],["Polyglot","A person who speaks more than one language"],["Recluse","One who lives in solitude"],["Somnambulist","Someone who walks in sleep"],["Stoic","A person indifferent to life's pains and pleasures"],["Termagant","A scolding, nagging, bad,tempered woman"],["Uxorious","A man overly fond of his wife"],["Virtuoso","One with outstanding technical ability in a field"],["Battery","A group of guns or missile launchers operated together at one place"],["Bale","A large bundle bound for storage or transport"],["Bevy","A large gathering of people of a particular type"],["Bouquet","An arrangement of flowers that is usually given as a present"],["Brood","A family of young animals"],["Cache","A group of things that have been hidden in a secret place"],["Caravan","A group of people, typically with vehicles or animals travelling together"],["Caucus","A closed political meeting"],["Clique","An exclusive circle of people with a common purpose"],["Claque","A group of followers hired to applaud at a performance"],["Constellation","A series of stars"],["Cortège","A funeral procession"],["Congregation","A group of worshippers"],["Drove","A herd or flock of animals being driven in a body"],["Flotilla","A small fleet of ships or boats"],["Grove","A small growth of trees without underbrush"],["Hamlet","A community of people smaller than a village"],["Herd","A group of cattle or sheep or other domestic mammals"],["Horde","A large group of people"],["Posse","A temporary police force"],["Shoal","A large number of fish swimming together"],["Torrent","A strong and fast-moving stream of water or other liquid"],["Anonymous","without a name / unknown identity"],["Incantation","a magical chant or spell"],["Confide","to share a secret or trust someone"],["Secluded","isolated / away from others"],["Implore","to beg earnestly"],["Bewildered","confused / puzzled"],["Amulet","a good luck charm / a magical object for protection"],["Comrade","a companion / friend, especially in difficult times"],["Ominous","suggesting something bad is going to happen"],["Rebellious","resisting authority / disobedient"],["Reluctant","unwilling / hesitant"],["Resolved","firmly determined"],["Summoned","called forth / requested presence"],["Eternity","infinite time / forever"],["Mutiny","rebellion against authority"],["Stern","strict / serious"],["Remorse","deep regret or guilt"],["Solemn","serious and formal"],["Prophesy","to predict the future"],["Tranquil","peaceful / calm"],["Devout","deeply religious"],["Fierce","intense / aggressive"],["Vengeance","revenge"],["Indignant","angry due to unfair treatment"],["Bewitched","under a magical spell"],["Ceased","stopped"],["Perplexed","confused or puzzled"],["Grumbled","complained in a low voice"],["Penetrating","entering or piercing through"],["Vow","a solemn promise"],["Quarrelled","argued"],["Abode","a home / residence"],["Plundered","robbed violently"],["Haunting","unforgettable / often returning in memory"],["Lurking","hiding and waiting secretly"],["Dagger","a small, sharp knife"],["Allies","friends or supporters in a conflict"],["Perished","died"],["Shattered","broken into pieces"],["Betrayal","disloyalty"],["Fiercely","violently or strongly"],["Mourning","showing sorrow for someone's death"],["Vanquished","defeated completely"],["Halted","stopped"],["Seized","grabbed suddenly"],["Betrayed","was disloyal to someone"],["Hasty","done quickly without thought"],["Grief","deep sorrow"],["Mournful","expressing sadness"],["Cursed","spoken or affected by a magical spell"],["Triumph","a great victory or achievement"],["Devastated","deeply shocked or sad"],["Dwelling","a place where someone lives"],["Sorrowful","full of sorrow / very sad"],["Accursed","under a curse / hateful"],["Lamented","expressed grief or sorrow"],["Despair","loss of hope"],["Shrine","a holy place"],["Entreaty","a sincere request or plea"],["Enraged","very angry"]];
const bundledEnglishDeck=()=>({id:uid(),title:'English Vocabulary — 274 Words',description:'Imported from your own word list; meanings retained as provided.',folder:'Vocabulary',subject:'Languages',lang:'en-US',created:Date.now(),cards:bundledEnglishVocabulary.map(([term,definition])=>mkCard(term,definition))});
const initial=()=>({version:6,chineseNumbers:{attempts:0,correct:0,wrong:0,mistakes:[]},createdAt:Date.now(),_savedAt:0,numberLibraryReconciledV1:true,lastBackupAt:0,backupSnoozedUntil:0,englishVocabularyImportedV1:true,mistakeLog:[],arcadeBest:{},settings:{theme:'light',direction:'forward',showPronunciation:false,showPinyin:false,mcqDisplay:'meaning',writeParts:'both',sound:true,listenPinyin:false,backupReminderDays:7,largeText:false,learnTypes:['mc','write','tf']},decks:[bundledEnglishDeck(),chineseNotesDeck(),chineseNumberDeck()],chineseClassNotesImportedV1:true,chineseClassNotesImportedV2:true,chineseNumbersSeparatedV1:true,history:[],bestMatch:{}});
// Existing study sets are always preserved, including cards written in other scripts.
// Old language-specific example content is not installed for new users.
function normalizeData(stored){
 if(!stored||!Array.isArray(stored.decks))throw Error('Invalid library');
 const fresh=initial(),oldSettings=stored.settings||{};
 const {focusMode:_oldFocus,calmMotion:_oldCalm,...cleanSettings}=oldSettings;
 const next={...fresh,...stored,settings:{...fresh.settings,...cleanSettings,autoSpeak:false,showPinyin:oldSettings.showPinyin===true,mcqDisplay:['pinyin','meaning','both'].includes(oldSettings.mcqDisplay)?oldSettings.mcqDisplay:'meaning',writeParts:['pinyin','meaning','both','random'].includes(oldSettings.writeParts)?oldSettings.writeParts:'both'}};
 next.decks=stored.decks;
 for(const d of next.decks){for(const c of (d.cards||[]))normalizeChineseCard(c)}
 if(stored.chineseClassNotesImportedV1!==true){addChineseClassNotes(next);next.chineseClassNotesImportedV1=true;}
 if(stored.chineseClassNotesImportedV2!==true){addChineseClassNotes(next);next.chineseClassNotesImportedV2=true;}
 if(!next.englishVocabularyImportedV1){
   if(!next.decks.some(d=>d.title==='English Vocabulary — 274 Words'&&Array.isArray(d.cards))){next.decks.unshift(bundledEnglishDeck())}
   next.englishVocabularyImportedV1=true;
 }
 next.history=Array.isArray(stored.history)?stored.history.slice(-800):[];
 next.mistakeLog=Array.isArray(stored.mistakeLog)?stored.mistakeLog.slice(-500):[];
 next.arcadeBest=stored.arcadeBest&&typeof stored.arcadeBest==='object'?stored.arcadeBest:{};
 next.bestMatch=stored.bestMatch&&typeof stored.bestMatch==='object'?stored.bestMatch:{};
 next.chineseNumbers=stored.chineseNumbers&&typeof stored.chineseNumbers==='object'?{...fresh.chineseNumbers,...stored.chineseNumbers,mistakes:Array.isArray(stored.chineseNumbers.mistakes)?stored.chineseNumbers.mistakes.slice(0,30):[]}:fresh.chineseNumbers;
  next.languageLab=stored.languageLab&&typeof stored.languageLab==='object'?stored.languageLab:{};
 if(!Object.prototype.hasOwnProperty.call(oldSettings,'showPronunciation')){
   next.settings.showPronunciation=false;
   next.settings.listenPinyin=false;
   next.settings.autoSpeak=false;
 }
 next.createdAt=Number(stored.createdAt)||Date.now();
 next._savedAt=Number(stored._savedAt)||0;
 if(!stored.chineseNumbersSeparatedV1){splitChineseNumbersOnce(next);next.chineseNumbersSeparatedV1=true;}
 // Upgrade once, not on every app launch: respect later edits and deletions.
 if(stored.numberLibraryReconciledV1!==true)reconcileNumberLibrary(next);
 next.numberLibraryReconciledV1=true;
 next.version=6;
 return next;
}
let data,hadLocalState=false;
try {const raw=localStorage.getItem(STORAGE);hadLocalState=!!raw;data=raw?normalizeData(JSON.parse(raw)):initial()}catch(e){data=initial()}
// IndexedDB is primary durable browser storage; localStorage is a synchronous fallback.
// The original storage key stays unchanged to migrate existing users' real decks.
let databasePromise=null,startupComplete=false,lastStorageWarning=0;
// Coalesce closely spaced IndexedDB writes. Keep synchronous localStorage as a
// first-line checkpoint; write the latest snapshot, not every intermediate one.
let pendingDbSnapshot=null,dbFlushTimer=null,dbWriting=false;
async function flushDatabase(){
 if(dbFlushTimer!==null){clearTimeout(dbFlushTimer);dbFlushTimer=null;}
 if(dbWriting||pendingDbSnapshot===null)return;
 dbWriting=true;
 const serialized=pendingDbSnapshot;
 pendingDbSnapshot=null;
 try{await writeDatabase(serialized)}catch(e){
  if(!lastLocalSaveWorked&&Date.now()-lastStorageWarning>30000){
   lastStorageWarning=Date.now();toast('Device storage is unavailable. Export a JSON backup to keep your sets.');
  }
 }finally{
  dbWriting=false;
  if(pendingDbSnapshot!==null)dbFlushTimer=setTimeout(flushDatabase,0);
 }
}
let lastLocalSaveWorked=false;
function scheduleDatabaseWrite(serialized){
 pendingDbSnapshot=serialized;
 if(dbFlushTimer!==null)clearTimeout(dbFlushTimer);
 dbFlushTimer=setTimeout(flushDatabase,180);
}
// When leaving a page, begin committing the newest pending snapshot promptly.
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushDatabase()});
window.addEventListener('pagehide',()=>flushDatabase());
function openDatabase(){
 if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB unavailable'));
 if(databasePromise)return databasePromise;
 databasePromise=new Promise((resolve,reject)=>{
   let request;
   try{request=indexedDB.open('recall_studio_offline_db',1)}catch(e){reject(e);return}
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('library'))db.createObjectStore('library')};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('IndexedDB blocked'));
   request.onblocked=()=>reject(Error('Database blocked by another app tab'));
 });
 return databasePromise;
}
async function readDatabase(){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
   const tx=db.transaction('library','readonly');
   const req=tx.objectStore('library').get('state');
   req.onsuccess=()=>resolve(req.result||null);
   req.onerror=()=>reject(req.error||Error('Unable to read database'));
 });
}
async function writeDatabase(serialized){
 const db=await openDatabase();
 return new Promise((resolve,reject)=>{
   let tx;
   try{tx=db.transaction('library','readwrite');tx.objectStore('library').put(JSON.parse(serialized),'state')}catch(e){reject(e);return}
   tx.oncomplete=resolve;
   tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
   tx.onerror=()=>reject(tx.error||Error('Storage transaction failed'));
 });
}
const save=()=>{
 data._savedAt=Date.now();
 const serialized=JSON.stringify(data);
 lastLocalSaveWorked=false;
 try{localStorage.setItem(STORAGE,serialized);lastLocalSaveWorked=true}catch(e){}
 scheduleDatabaseWrite(serialized);
 if(!lastLocalSaveWorked&&!('indexedDB' in window)&&Date.now()-lastStorageWarning>30000){lastStorageWarning=Date.now();toast('Cannot save automatically. Export a JSON backup.');}
 return true;
};
async function hydrateData(){
 try {
   const idb=await readDatabase();
   if(idb&&Array.isArray(idb.decks)&&(!hadLocalState||Number(idb._savedAt||0)>Number(data._savedAt||0))){
     data=normalizeData(idb);
   }
 }catch(e){/* Continue with localStorage on unsupported/private file origins. */}
 startupComplete=true;
 ui.deckId=data.decks[0]?.id||'';
 save();
 render();
}
function backupDue(){
 const n=Number(data.settings.backupReminderDays);
 if(!n||n<1||!data.decks.some(d=>d.cards?.length))return false;
 const last=Number(data.lastBackupAt||data.createdAt)||Date.now();
 return Date.now()>=last+n*86400000 && Date.now()>=Number(data.backupSnoozedUntil||0);
}
function backupReminder(){return !backupDue()?'':`<div class="backup-reminder" role="status"><div><strong>Protect your study sets</strong><div class="small muted">It's time for an offline backup. Your browser can lose data if its storage is cleared.</div></div><div class="row wrap"><button class="btn primary small" data-act="backup">${icon('download')} Download backup</button><button class="btn small" data-act="snooze-backup">Remind me later</button></div></div>`}
const icons={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',library:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',star:'<path d="m12 2 3.1 6.4 7.1 1-5.1 5 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-5 7.1-1L12 2z"/>',chart:'<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l-1.9 1.9a1.6 1.6 0 0 0-1.8-.3l-1.3.5-.6 2.1h-2.7l-.6-2.1-1.3-.5a1.6 1.6 0 0 0-1.8.3l-1.9-1.9a1.6 1.6 0 0 0 .3-1.8L5.6 13 3.5 12.4V9.7l2.1-.6.5-1.3a1.6 1.6 0 0 0-.3-1.8l1.9-1.9a1.6 1.6 0 0 0 1.8.3l1.3-.5.6-2.1h2.7l.6 2.1 1.3.5a1.6 1.6 0 0 0 1.8-.3l1.9 1.9a1.6 1.6 0 0 0-.3 1.8l.5 1.3 2.1.6v2.7l-2.1.6z"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5"/><path d="M4 15v5h16v-5"/>',download:'<path d="M12 3v13m-5-5 5 5 5-5"/><path d="M4 18v3h16v-3"/>',arrow:'<path d="m9 18 6-6-6-6"/>',back:'<path d="m15 18-6-6 6-6"/>',check:'<path d="m5 12 5 5L20 7"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',cards:'<rect x="6" y="4" width="15" height="17" rx="2"/><path d="M3 8v12M10 9h7M10 13h5"/>',brain:'<path d="M12 4a4 4 0 0 0-7 3A4 4 0 0 0 4 14a4 4 0 0 0 7 5M12 4a4 4 0 0 1 7 3 4 4 0 0 1 1 7 4 4 0 0 1-7 5M12 4v15"/>',pen:'<path d="m3 17-1 4 4-1L19 7l-3-3L3 17zM14 6l3 3"/>',test:'<path d="M7 3H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M9 3h6v4H9zM8 12h8M8 16h6"/>',game:'<rect x="2" y="6" width="20" height="12" rx="5"/><path d="M7 12h5M9.5 9.5v5M16.5 11h.01M19 13h.01"/>',zap:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',speaker:'<path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',refresh:'<path d="M20 6v6h-6M4 18v-6h6"/><path d="M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>',edit:'<path d="M4 20h4L20 8l-4-4L4 16v4zM14 6l4 4"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',moon:'<path d="M20 16.5A9 9 0 0 1 7.5 4 9 9 0 1 0 20 16.5z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',shuffle:'<path d="M3 7h3c5 0 7 10 12 10h3m-4-4 4 4-4 4M3 17h3c2 0 3-1.6 4-3M16 7h5m-4-4 4 4-4 4"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',cloudOff:'<path d="m2 2 20 20M9.1 5.1A7 7 0 0 1 21 11.5M3 14a4 4 0 0 1 3-4 6 6 0 0 1 .6-2M7 19h12"/>'};
const icon=(name)=>`<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[name]||icons.cards}</svg></span>`;
let ui={analyticsSort:'wrong',analyticsDir:'desc',analyticsOnlyMissed:true,page:'home',deckId:data.decks[0]?.id||'',filter:'all',q:'',modal:'',editing:'',session:null,match:null,notice:'',test:null};ui.libraryFilters={subject:'all',status:'all',sort:'recent',selected:[],selectMode:false,expanded:false};let timerHandle=null;let flashRevealTimer=null;let pendingFileImage=null;let searchRenderTimer=null;
function toast(s){let root=$('#toast-root');if(!root)return;let el=document.createElement('div');el.className='toast';el.textContent=s;root.appendChild(el);setTimeout(()=>el.remove(),3900)}
const getDeck=(id=ui.deckId)=>data.decks.find(d=>d.id===id);
const getCard=(id,d=getDeck())=>d?.cards.find(c=>c.id===id);

const mastery=c=>{let answered=(c.correct||0)+(c.wrong||0);return answered===0?0:(c.streak>=3||c.interval>=7)?100:Math.max(12,Math.min(85,Math.round(100*(c.correct||0)/answered)))};
const deckMastery=d=>d.cards.length?Math.round(d.cards.reduce((a,c)=>a+mastery(c),0)/d.cards.length):0;

const allCards=()=>data.decks.reduce((n,d)=>n+d.cards.length,0);
const fmtDate=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const activeRoute=page=>ui.page===page||(page==='library'&&['deck','study','test','stats'].includes(ui.page));
function nav(page,deckId){clearTimeout(searchRenderTimer);searchRenderTimer=null;clearTimeout(flashRevealTimer);flashRevealTimer=null;if(['lab'].includes(page))page='deck';clearInterval(timerHandle);timerHandle=null;ui.page=page;if(page!=='lab'&&ui.lab)ui.lab.session=null;if(deckId)ui.deckId=deckId;ui.modal='';ui.session=null;ui.test=null;document.body.classList.remove('mobile-nav');render();window.scrollTo(0,0)}
function render(){data.settings.autoSpeak=false;document.documentElement.dataset.theme=data.settings.theme;const themeMeta=document.querySelector('#recall-theme-color');if(themeMeta)themeMeta.setAttribute('content',data.settings.theme==='dark'?'#121726':'#f5f7fc');document.documentElement.dataset.bigtext=data.settings.largeText?'yes':'no';const pageTitle={home:'Dashboard',library:'My library',deck:'Your study set',study:'Study session',test:'Practice test',import:'Import cards',settings:'Preferences',stats:'Your progress',};$('#app').innerHTML=`<div class="shell"><div class="mobile-backdrop" data-act="close-menu"></div><aside class="sidebar"><div class="brand"><span class="brand-logo">${icon('brain')}</span> Recall <span style="color:var(--brand)">Studio</span></div><div class="nav-label">WORKSPACE</div>${navItem('home','home','Dashboard')}${navItem('library','library','My library')}${navItem('stats','chart','Study analytics')}<div class="nav-label" style="margin-top:24px">TOOLS</div>${navItem('import','upload','Import cards')}${navItem('settings','settings','Settings')}<div class="sidebar-spacer"></div><div class="small muted" style="padding:15px 12px 0">Independent & free • 1.0.0</div></aside><main class="main"><header class="topbar"><div class="top-left">${ui.page!=='home'?`<button class="icon-btn top-back" data-act="go-back" aria-label="Go back" title="Back">${icon('back')}</button>`:''}<button class="icon-btn menu-toggle" data-act="open-menu" aria-label="Open navigation">${icon('menu')}</button><span class="top-title">${pageTitle[ui.page]||'Recall Studio'}</span></div><div class="top-actions"><button class="icon-btn" data-act="show-help" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">?</button><span class="pill purple" style="display:flex;align-items:center;gap:6px">${icon('cloudOff')} <span class="btn-text">Private & offline</span></span><button class="btn small primary" data-act="new-deck">${icon('plus')} <span class="btn-text">New set</span></button></div></header><div class="content">${backupReminder()}${renderPage()}</div></main></div>`;renderModal();}
function navItem(page,ico,label){return `<button class="navbtn ${activeRoute(page)?'active':''}" data-act="nav" data-page="${page}">${icon(ico)} ${esc(label)}</button>`}
function renderPage(){switch(ui.page){case'home':return homePage();case'library':return libraryPage();case'deck':return deckPage();case'study':return studyPage();case'test':return testPage();case'import':return importPage();case'settings':return settingsPage();case'stats':return statsPage();default:return homePage()}}
function statBlock(name,value,ico){return `<div class="stat"><div class="stat-top"><span class="muted">${name}</span><span class="stat-icon">${icon(ico)}</span></div><strong>${value}</strong></div>`}
function homePage(){
 const total=allCards(),studied=data.decks.flatMap(d=>d.cards).filter(c=>(c.correct||0)+(c.wrong||0)>0).length;
 const learningCount=data.decks.reduce((n,d)=>n+learningCards(d).length,0);
 const wrongCount=data.decks.reduce((n,d)=>n+d.cards.reduce((k,c)=>k+(c.wrong||0),0),0);
 const rightCount=data.decks.reduce((n,d)=>n+d.cards.reduce((k,c)=>k+(c.correct||0),0),0);
 const acc=rightCount+wrongCount?Math.round(100*rightCount/(rightCount+wrongCount))+'%':'—';
 const first=data.decks[0];
 return `<div class="today-panel"><div class="today-content"><div class="eyebrow">YOUR STUDY OVERVIEW</div><h1>Today's review</h1><p class="muted">Continue where you left off. Every correct and incorrect answer builds your progress.</p><div class="choose-set-actions"><button class="btn choose-set-launch" data-act="${first?'nav':'new-deck'}" ${first?'data-page="library"':''} aria-label="${first?'Choose a study set from your library':'Create a study set'}"><span class="choose-set-symbol">${icon('cards')}</span><span class="choose-set-copy"><strong>${first?'Choose a study set':'Create a study set'}</strong><small>${data.decks.length} ${data.decks.length===1?'set':'sets'} · ${total} ${total===1?'card':'cards'}</small></span><span class="choose-set-chevron">${icon('arrow')}</span></button><button class="btn" data-act="nav" data-page="stats">${icon('chart')} Mistake details</button></div></div><div class="today-grid"><div class="today-metric"><strong>${wrongCount}</strong><span>Missed answers</span></div><div class="today-metric"><strong>${learningCount}</strong><span>Still learning</span></div><div class="today-metric"><strong>${acc}</strong><span>Answer accuracy</span></div><div class="today-metric"><strong>${studied}</strong><span>Cards practised</span></div></div></div><div class="stats-grid">${statBlock('Study sets',data.decks.length,'library')}${statBlock('Total cards',total,'cards')}${statBlock('Cards practised',studied,'check')}${statBlock('Wrong answers',wrongCount,'chart')}</div><div class="heading-row"><div><h2>My study sets</h2><div class="muted small">Select a set to practise</div></div><button class="btn small" data-act="nav" data-page="library">View all ${icon('arrow')}</button></div>${data.decks.length?`<div class="cards-grid">${data.decks.slice(0,8).map(deckCard).join('')}</div>`:emptyDeck()}${data.history.length?`<div class="heading-row"><div><h2>Recent learning</h2></div></div><div class="surface">${historyHtml(4)}</div>`:''}`;
}


function emptyDeck(){return `<div class="empty surface"><div class="empty-art">📚</div><h3>No study sets yet</h3><p class="muted">Create a set or import your existing flashcards.</p><button class="btn primary" data-act="new-deck">${icon('plus')} Create a set</button> <button class="btn" data-act="nav" data-page="import">Import cards</button></div>`}
function libraryPage(){
 const lf=ui.libraryFilters;
 const folders=[...new Set(data.decks.map(d=>d.folder).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const subjects=[...new Set(data.decks.map(d=>d.subject||'General'))].sort((a,b)=>a.localeCompare(b));
 const query=ui.q.trim().toLocaleLowerCase();
 const statusOk=(d)=>{
  const m=setMetrics(d);
  switch(lf.status){
   case 'new':return m.unseen===d.cards.length;
   case 'learning':return m.learning>0;
   case 'mastered':return d.cards.length>0&&m.mastered===d.cards.length;
   case 'starred':return m.starred>0;
   
   default:return true;
  }
 };
 const list=data.decks.filter(d=>(ui.filter==='all'||d.folder===ui.filter)&&(lf.subject==='all'||(d.subject||'General')===lf.subject)&&statusOk(d)&&(!query||[d.title,d.description,d.subject,d.folder].some(x=>String(x||'').toLocaleLowerCase().includes(query))||d.cards.some(c=>`${c.term} ${c.definition} ${c.pinyin||''}`.toLocaleLowerCase().includes(query))));
 const sorts={recent:(a,b)=>(b.created||0)-(a.created||0),name:(a,b)=>a.title.localeCompare(b.title),cards:(a,b)=>b.cards.length-a.cards.length,wrong:(a,b)=>setMetrics(b).wrong-setMetrics(a).wrong,accuracy:(a,b)=>(setMetrics(a).accuracy??101)-(setMetrics(b).accuracy??101),correct:(a,b)=>setMetrics(b).right-setMetrics(a).right,attempts:(a,b)=>(setMetrics(b).wrong+setMetrics(b).right)-(setMetrics(a).wrong+setMetrics(a).right),mastery:(a,b)=>deckMastery(a)-deckMastery(b)};
 list.sort(sorts[lf.sort]||sorts.recent);
 const selectedCount=lf.selected.filter(id=>data.decks.some(d=>d.id===id)).length;
 const activeFilters=(ui.filter!=='all')+(lf.subject!=='all')+(lf.status!=='all')+(!!query);
 const optionList=(values,chosen)=>values.map(([val,label])=>`<option value="${escAttr(val)}" ${chosen===val?'selected':''}>${esc(label)}</option>`).join('');
 const hasLegacyChinese=data.decks.some(d=>d.cards.some(c=>/你们|nǐmen|nimen/i.test(String(c.term||'')+' '+String(c.pinyin||''))));
 return `<div class="heading-row"><div><div class="eyebrow">COLLECTION</div><h1>My library</h1><p class="muted">Your saved sets. Search, filter, or remove anything you no longer need.</p></div><div class="row wrap"><button class="btn" data-act="nav" data-page="import">${icon('upload')} Import</button><button class="btn primary" data-act="new-deck">${icon('plus')} Create set</button></div></div>


 <div class="surface library-filters ${lf.expanded?'is-expanded':''}" aria-label="Library search and filters">
  <div class="row wrap space-between filter-heading"><strong>Find study sets</strong><div class="row wrap gap-sm"><span class="muted small">${list.length} of ${data.decks.length} sets</span><button class="btn small" data-act="reset-library-filters" ${activeFilters?'':'disabled'}>Clear filters ${activeFilters?'('+activeFilters+')':''}</button><button class="btn small ${lf.selectMode?'soft':''}" data-act="toggle-bulk-select">${lf.selectMode?'Done selecting':'Select multiple'}</button></div></div>
  <div class="library-searchbar-row"><div class="search library-search">${icon('search')}<input data-role="library-search" placeholder="Search sets or terms…" value="${escAttr(ui.q)}" aria-label="Search sets"/></div><button type="button" class="btn small" data-act="toggle-library-search" aria-expanded="${!!lf.expanded}">${lf.expanded?'Less filters −':'Expand filters +'}</button></div>
  <div class="filter-row folder-filters extra-library-filters"><button class="filter ${ui.filter==='all'?'active':''}" data-act="folder-filter" data-folder="all">All folders</button>${folders.map(f=>`<button class="filter ${ui.filter===f?'active':''}" data-act="folder-filter" data-folder="${escAttr(f)}">${esc(f)}</button>`).join('')}</div>
  <div class="library-filter-grid extra-library-filters">
   <label>Subject<select class="select" data-library-filter="subject" aria-label="Filter library by subject">${optionList([['all','Any subject'],...subjects.map(x=>[x,x])],lf.subject)}</select></label>
   <label>Progress<select class="select" data-library-filter="status" aria-label="Filter library by study progress">${optionList([['all','Any progress'],['new','Not studied'],['learning','Still learning'],['mastered','All mastered'],['starred','Contains starred cards'],],lf.status)}</select></label>
   <label>Sort by<select class="select" data-library-filter="sort" aria-label="Sort library">${optionList([['recent','Newest first'],['name','Name A–Z'],['cards','Most cards'],['wrong','Most wrong answers'],['accuracy','Lowest accuracy'],['correct','Most correct'],['attempts','Most attempted'],['mastery','Least mastered']],lf.sort)}</select></label>
  </div>
  ${lf.selectMode?`<div class="bulk-actions"><span>${selectedCount} selected</span><button class="btn small" data-act="select-filtered-decks">Select shown</button><button class="btn small" data-act="unselect-decks">Clear selection</button><button class="btn small danger" data-act="delete-selected-decks" ${selectedCount?'':'disabled'}>${icon('trash')} Delete selected</button></div>`:''}
 </div>
 ${list.length?`<div class="cards-grid">${list.map(deckCard).join('')}</div>`:`<div class="surface empty"><h3>No matching sets</h3><p class="muted">Try clearing a filter or searching a different term.</p><button class="btn" data-act="reset-library-filters">Clear filters</button></div>`}`;
}

function modeButton(id,ico,title,desc){return `<button class="mode-card" data-act="start" data-mode="${id}"><span class="mode-icon">${icon(ico)}</span><span><strong>${title}</strong><small>${desc}</small></span></button>`}
function deckPage(){let d=getDeck();if(!d)return emptyDeck();let p=deckMastery(d),f=ui.q.toLowerCase();let cards=d.cards.filter(c=>!f||`${c.term} ${c.definition} ${c.pinyin} ${c.notes}`.toLowerCase().includes(f));return `<div class="crumb"><button data-act="nav" data-page="library">My library</button>${icon('arrow')} ${esc(d.title)}</div><div class="row space-between wrap" style="margin-bottom:14px"><span class="pill purple">${esc(d.subject||'General')} ${d.folder?'· '+esc(d.folder):''}</span><div class="row wrap gap-sm"><button class="btn small" data-act="edit-deck">${icon('edit')} Edit set</button><button class="btn small" data-act="export-deck">${icon('download')} Export</button><button class="btn small danger" data-act="delete-deck">${icon('trash')}</button></div></div><div class="row space-between" style="align-items:center;gap:20px;margin-bottom:25px"><div class="deck-hero"><span class="deck-icon">📚</span><div><h1>${esc(d.title)}</h1><p class="muted">${esc(d.description||'Learn at your own pace.')}</p><div class="row wrap"><span class="pill">${d.cards.length} terms</span><span class="pill">${d.cards.filter(c=>c.starred).length} starred</span></div></div></div><div class="progress-ring" style="--p:${p}"><div><strong>${p}%</strong><small>mastered</small></div></div></div><div class="split"><div><section class="surface"><div class="section-heading"><h2>Choose a study mode</h2><div class="row wrap"><button class="btn small" data-act="start" data-mode="flash" data-scope="random">${icon('shuffle')} Random</button><button class="btn small" data-act="start" data-mode="learn" data-scope="starred">${icon('star')} Starred</button></div></div><div class="modes-grid">${modeButton('flash','cards','Flashcards','Flip, mark Right / Wrong')}${modeButton('learn','brain','Learn','Mixed, adaptive questions')}${modeButton('mc','test','MCQ','Unlimited multiple choice')}${modeButton('blitz','zap','Blitz','60-second challenge')}${modeButton('write','pen','Write','Type the answer')}${modeButton('test','test','Practice test','Customizable exams')}</div></section><section class="surface" style="margin-top:22px"><div class="section-heading"><div><h2>Terms in this set</h2><p class="muted small" style="margin-bottom:0">Edit your definitions and notes</p></div><button class="btn small primary" data-act="add-card">${icon('plus')} Add term</button></div><div class="search" style="max-width:100%;margin:14px 0"><span>${icon('search')}</span><input data-role="term-search" placeholder="Find a term…" value="${escAttr(ui.q)}"/></div>${cards.length?cards.map(c=>`<div class="term-row"><div><div class="term-name ${d.lang?.startsWith('zh')?'hanzi':''}">${esc(c.term)}</div>${pinyinHintHtml(c)}</div><div class="term-def">${esc(isChineseCard(c)?chineseCardParts(c).meaning:c.definition)}${c.notes?`<div class="small muted">${esc(c.notes)}</div>`:''}</div><div class="term-actions"><button class="icon-btn ${c.starred?'active':''}" data-act="star" data-id="${c.id}" aria-label="${c.starred?'Unstar':'Star'}">${icon('star')}</button><button class="icon-btn" data-act="edit-card" data-id="${c.id}" aria-label="Edit term">${icon('edit')}</button><button class="icon-btn" data-act="speak" data-id="${c.id}" aria-label="Hear term manually">${icon('speaker')}</button></div></div>`).join(''):`<p class="muted">No terms match your search.</p>`}</section></div><div><section class="surface"><h3>Your learning progress</h3><p class="muted small">Automatically tracked as you practise</p><div class="row space-between"><span>Cards mastered</span><strong>${d.cards.filter(c=>mastery(c)>=100).length} / ${d.cards.length}</strong></div><div class="bar" style="margin:9px 0 23px"><span style="width:${p}%"></span></div><div class="row space-between" style="margin-bottom:12px"><span class="muted">Practised</span><strong>${d.cards.filter(c=>c.correct+c.wrong>0).length}</strong></div><div class="row space-between"><span class="muted">Starred</span><strong>${d.cards.filter(c=>c.starred).length}</strong></div><button class="btn soft" style="margin-top:19px;width:100%" data-act="start" data-mode="learn">${icon('brain')} Start Learn</button></section>${deckInsights(d)}<section class="note-panel" style="margin-top:19px"><strong>💡 Study tip</strong><p style="margin:8px 0 0">Mark flashcards Right or Wrong to track what you remember. Review your most frequently missed words above.</p></section><section class="surface" style="margin-top:19px"><h3>Study settings</h3><div class="field"><label for="direction">Question direction</label><select class="select" id="direction" data-setting="direction"><option value="forward" ${data.settings.direction==='forward'?'selected':''}>Term → meaning</option><option value="reverse" ${data.settings.direction==='reverse'?'selected':''}>Meaning → term</option></select></div><div class="switch-row"><span><strong>Show Pinyin</strong><div class="small muted">Hints in practice and term lists. Flashcard backs always show Pinyin + meaning.</div></span><input type="checkbox" data-setting="showPinyin" ${data.settings.showPinyin?'checked':''}></div><p class="small muted">Audio is manual only. Tap a speaker icon to listen.</p></section></div></div>`}
function importPage(){return `<div class="eyebrow">BRING YOUR NOTES</div><h1>Import flashcards</h1><p class="muted">Copy terms from Quizlet, paste CSV/TSV, or restore an exported backup. Files are processed only in your browser.</p><div class="split"><div class="surface"><div class="section-heading"><h2>Paste your flashcards</h2><span class="pill green">No limits</span></div><div class="field"><label for="import-title">Set name</label><input class="input" id="import-title" placeholder="e.g. Marketing — Chapter 4" value="My imported flashcards"/></div><div class="field"><label for="import-folder">Folder</label><input class="input" id="import-folder" placeholder="e.g. Semester 2" value=""/></div><div class="field"><label for="import-text">Cards (one per line)</label><textarea class="textarea" id="import-text" rows="11" placeholder="Demand[TAB]Willingness and ability to buy&#10;Supply[TAB]Quantity offered for sale" style="min-height:215px"></textarea></div><div class="small muted" style="margin-bottom:18px">Use a Tab between the term and definition. Additional columns are optional. Comma-separated CSV with headings also works. Quizlet's tab-separated export can be pasted directly.</div><div class="row wrap"><button class="btn primary" data-act="import-text">${icon('upload')} Import cards</button><button class="btn" data-act="paste-demo">Paste example</button></div></div><div><div class="surface"><h3>Import from a file</h3><p class="muted small">Supported: .csv, .tsv, .txt and Recall Studio .json backup files.</p><div class="dropzone">${icon('upload')}<p style="margin:9px 0">Choose a file from your device</p><input type="file" id="import-file" accept=".csv,.tsv,.txt,.json,text/plain,text/csv,application/json"/></div></div><div class="surface" style="margin-top:18px"><h3>Your data stays yours</h3><p class="muted small">Export all your sets, learning history and settings to a single JSON file. Restore it on another device even without an internet connection.</p><button class="btn" data-act="backup">${icon('download')} Download full backup</button></div><div class="note-panel" style="margin-top:18px"><strong>How to migrate from Quizlet</strong><p style="margin:8px 0 0">Open your set in Quizlet → Export (if available) → copy the term/definition rows → paste above. You can also create a CSV in Excel, Google Sheets or Numbers and import it here.</p></div></div></div>`}
function settingsPage(){return `<div class="eyebrow">MAKE IT YOURS</div><h1>Settings</h1><p class="muted">Everything works locally. No account, tracker, ads or subscription.</p><div class="split"><div class="surface"><h2>Study preferences</h2><div class="field"><label>Question direction</label><select class="select" data-setting="direction"><option value="forward" ${data.settings.direction==='forward'?'selected':''}>Term → definition</option><option value="reverse" ${data.settings.direction==='reverse'?'selected':''}>Definition → term</option></select></div><div class="field"><label>Appearance</label><select class="select" data-setting="theme"><option value="light" ${data.settings.theme==='light'?'selected':''}>Light theme</option><option value="dark" ${data.settings.theme==='dark'?'selected':''}>Dark theme</option></select></div><div class="switch-row"><span><strong>Show Pinyin</strong><div class="muted small">Shows extra reading hints in Chinese set lists, Learn, MCQ, Blitz, Write and Practice Tests. OFF hides hints on questions; ON shows Pinyin under Chinese prompts. Flashcard backs always show Pinyin then meaning. Shortcut: Alt+P.</div></span><input type="checkbox" data-setting="showPinyin" ${data.settings.showPinyin?'checked':''}/></div><div class="note-panel"><strong>Audio: manual playback only</strong><p class="muted small">Tap the speaker (♫) button whenever you want to hear a term. The app never plays audio automatically. Availability depends on the voices installed on this device.</p></div><div class="switch-row"><span><strong>Large study text</strong><div class="muted small">Also available from the study toolbar</div></span><input type="checkbox" data-setting="largeText" ${data.settings.largeText?'checked':''}/></div><div class="switch-row"><span><strong>Sound effects</strong><div class="muted small">Audio cues for correct and incorrect answers</div></span><input type="checkbox" data-setting="sound" ${data.settings.sound?'checked':''}/></div><h3 style="margin-top:22px">Learn mode question types</h3>${[['mc','Multiple choice'],['write','Written answers'],['tf','True / false']].map(([v,k])=>`<div class="switch-row"><span>${k}</span><input type="checkbox" data-learn-type="${v}" ${data.settings.learnTypes.includes(v)?'checked':''}/></div>`).join('')}</div><div><div class="surface"><h2>Backup & privacy</h2><p class="muted small">Your decks are saved with browser storage (IndexedDB and a localStorage fallback where supported). Both are tied to this browser and this specific app URL/file origin. Clearing website data can erase them. Keep JSON backups.</p><div class="field"><label for="backup-days">Backup reminder</label><select class="select" id="backup-days" data-setting="backupReminderDays"><option value="7" ${Number(data.settings.backupReminderDays)===7?'selected':''}>Every 7 days</option><option value="14" ${Number(data.settings.backupReminderDays)===14?'selected':''}>Every 14 days</option><option value="30" ${Number(data.settings.backupReminderDays)===30?'selected':''}>Every 30 days</option><option value="0" ${Number(data.settings.backupReminderDays)===0?'selected':''}>Off</option></select></div><button class="btn primary" data-act="backup">${icon('download')} Back up everything</button><button class="btn" style="margin-top:10px" data-act="nav" data-page="import">${icon('upload')} Restore / import</button><div class="note-panel" style="margin-top:18px"><strong>Offline support</strong><p style="margin:7px 0 0">The desktop standalone HTML works without hosting. To install on iPhone or Android as an app, open the PWA folder from an HTTPS website once and choose “Add to Home Screen” or “Install app”. After installation, it works offline.</p></div></div><div class="surface" style="margin-top:18px"><h3>Keyboard shortcuts</h3><div class="hist-row"><span>Open shortcut help</span><span class="kbd">?</span></div><div class="hist-row"><span>Star current card</span><span class="kbd">F</span></div><div class="hist-row"><span>MCQ answer choice</span><span class="kbd">1–4</span></div><div class="hist-row"><span>Show or hide Pinyin hints</span><span class="kbd">Alt+P</span></div><div class="hist-row"><span>Flip a flashcard</span><span class="kbd">Space</span></div><div class="hist-row"><span>Next card</span><span class="kbd">→</span></div><div class="hist-row"><span>Previous card</span><span class="kbd">←</span></div>${data.settings.showPronunciation?'<div class="hist-row"><span>Play pronunciation</span><span class="kbd">S</span></div>':''}<div class="hist-row"><span>Submit written answer</span><span class="kbd">Enter</span></div></div></div></div>`}
function historyHtml(limit=100){return data.history.slice(-limit).reverse().map(h=>`<div class="hist-row"><div><strong>${esc(getDeck(h.deckId)?.title||'Deleted set')}</strong><div class="muted small">${esc(h.mode.toUpperCase())} · ${fmtDate(h.at)}</div></div><div style="text-align:right"><strong>${h.correct}/${h.total}</strong><div class="muted small">${Math.round(h.duration/1000)} sec</div></div></div>`).join('')||'<p class="muted">Complete a quiz or review to see results here.</p>'}
function statsPage(){
 const all=data.decks.flatMap(d=>d.cards),right=all.reduce((n,c)=>n+(c.correct||0),0),wrong=all.reduce((n,c)=>n+(c.wrong||0),0);
 const most=all.filter(c=>(c.wrong||0)>0).sort((a,b)=>(b.wrong||0)-(a.wrong||0)).slice(0,20);
 const latest=(data.mistakeLog||[]).slice(-10).reverse();
 return `<div class="eyebrow">YOUR LEARNING JOURNEY</div><h1>Study analytics</h1><p class="muted">See exactly which words you miss and how often. Saved privately on this device.</p><div class="stats-grid">${statBlock('Study sessions',data.history.length,'brain')}${statBlock('Answers correct',right,'check')}${statBlock('Accuracy',right+wrong?Math.round(100*right/(right+wrong))+'%':'—','chart')}${statBlock('Wrong answers',wrong,'clock')}</div><div class="split"><section class="surface"><h2>Card performance</h2>${analyticsControls()}${detailedWrongRows(all,all.length)}</section><section class="surface"><h2>Last 10 wrong answers</h2>${latest.length?latest.map(m=>{const d=data.decks.find(x=>x.id===m.deckId),c=d?.cards.find(x=>x.id===m.cardId);return `<div class="wrong-detail-row"><div><strong>${esc(c?.term||m.term||'Unknown card')}</strong><div class="small muted">${esc(d?.title||'Previously deleted set')}</div></div><span class="small muted">${esc(m.mode||'study')} · ${fmtDate(m.at)}</span></div>`}).join(''):'<p class="muted small">Nothing missed yet.</p>'}</section></div><div class="split" style="margin-top:18px"><section class="surface"><h2>Set progress</h2>${data.decks.map(d=>`<div style="margin:21px 0"><div class="row space-between"><strong>${esc(d.title)}</strong><span class="muted">${deckMastery(d)}%</span></div><div class="bar" style="margin-top:9px"><span style="width:${deckMastery(d)}%"></span></div></div>`).join('')||'<p class="muted">No sets yet.</p>'}</section><section class="surface"><h2>Recent study sessions</h2>${historyHtml()}</section></div>`;
}


function currentCard(){const s=ui.session;return getCard(s.ids[s.pos],getDeck(s.deckId))}
function promptText(card){return data.settings.direction==='forward'?card.term:card.definition}
function solutionText(card){return data.settings.direction==='forward'?card.definition:card.term}
function alternatives(card){let vals=[solutionText(card)];if(data.settings.direction==='forward'){if(card.accepted)vals.push(...card.accepted.split(/\s*[|\n]\s*/));vals.push(...meaningVariants(isChineseCard(card)?studyChineseParts(card).meaning:card.definition));vals.push(card.definition.replace(/\s*\([^)]*\)/g,'').trim())}return vals.map(v=>v.trim()).filter(Boolean)}
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[.!?！？。；;:,，、“”"'’()（）\s]+/g,' ').trim();
function isCorrect(input,card,listen=false){if(listen){let expected=data.settings.listenPinyin&&card.pinyin?card.pinyin:card.term;return norm(input)===norm(expected)}let a=norm(input);if(!a)return false;return alternatives(card).some(x=>norm(x)===a)||(data.settings.direction==='forward'&&meaningMatches(input,isChineseCard(card)?studyChineseParts(card).meaning:card.definition))}

// Written Chinese: require reading and meaning independently. Keep typed answers and
// grading in one place so standalone Write, Learn, and Practice Test are consistent.
function chineseWriteMode(card){return isChineseCard(card)&&data.settings.direction==='forward'}
function pinyinMatches(input,expected){
 const simplify=s=>String(s||'').normalize('NFC').toLocaleLowerCase().replace(/[\s’'·.·-]+/g,'').trim();
 if(!expected)return false;
 if(simplify(input)===simplify(expected))return true;
 // Also accept tone numbers such as ni3 hao3 (helpful on keyboards without tone marks).
 const tones={'ā':'a1','á':'a2','ǎ':'a3','à':'a4','ē':'e1','é':'e2','ě':'e3','è':'e4','ī':'i1','í':'i2','ǐ':'i3','ì':'i4','ō':'o1','ó':'o2','ǒ':'o3','ò':'o4','ū':'u1','ú':'u2','ǔ':'u3','ù':'u4','ǖ':'ü1','ǘ':'ü2','ǚ':'ü3','ǜ':'ü4'};
 const parse=s=>{let letters='',digits='';for(const ch of simplify(s)){if(tones[ch]){letters+=tones[ch][0];digits+=tones[ch][1]}else if(/[1-5]/.test(ch)){if(ch!=='5')digits+=ch}else letters+=ch}return {letters,digits}};
 const a=parse(input),b=parse(expected);
 return !!a.letters&&a.letters===b.letters&&a.digits===b.digits;
}
function meaningVariants(meaning){
 const value=String(meaning||'').replace(/^(?:meaning:)\s*/i,'').trim();
 const parts=value.split(/\s*(?:;|,|\/|\bor\b)\s*/i).map(x=>x.trim().replace(/^\s*(?:and|also)\s+/i,''));
 return [...new Set([value,...parts,...parts.map(x=>x.replace(/\s*\([^)]*\)\s*/g,'').trim())].map(norm).filter(Boolean))];
}
function meaningMatches(input,meaning){const candidate=norm(input);return !!candidate&&meaningVariants(meaning).includes(candidate);}
function activeWriteParts(card){if(ui.page==='test'||(ui.page==='study'&&ui.session?.mode!=='write'))return 'both';let mode=data.settings.writeParts||'both';if(mode!=='random')return mode;const q=ui.page==='study'?ui.session?.q:null;const tq=ui.page==='test'?ui.test?.questions?.find(x=>x.cardId===card?.id):null;if(q&&!q.writePart)q.writePart=Math.random()<.5?'pinyin':'meaning';if(tq&&!tq.writePart)tq.writePart=Math.random()<.5?'pinyin':'meaning';return q?.writePart||tq?.writePart||'meaning';}
function gradeChineseWrite(answers,card){
 const parts=studyChineseParts(card),pinyin=String(answers?.pinyin||'').trim(),meaning=String(answers?.meaning||'').trim();
 const mode=activeWriteParts(card),hasReading=!!parts.pinyin&&mode!=='meaning',hasMeaning=mode!=='pinyin'||!parts.pinyin;
 const pinyinRight=!hasReading||pinyinMatches(pinyin,parts.pinyin);
 const meaningRight=!hasMeaning||meaningMatches(meaning,parts.meaning);
 return {right:pinyinRight&&meaningRight,pinyinRight,meaningRight,hasReading,hasMeaning,pinyin,meaning,expectedPinyin:parts.pinyin,expectedMeaning:parts.meaning};
}
function chineseWriteFields(card,disabled=false,idx=null,feedback=null){
 const prefix=idx===null?'':`a_${idx}_`,parts=studyChineseParts(card),mode=activeWriteParts(card);
 const resultField=(key,label,helper,expected,wasCorrect,typed)=>{
  const reviewed=!!feedback, icon=reviewed?(wasCorrect?'✓':'✕'):'';
  const status=reviewed?`<span class="inline-answer-status ${wasCorrect?'ok':'error'}" role="status">${icon} ${wasCorrect?'Correct':'Incorrect'}</span>`:'';
  const note=reviewed&&!wasCorrect?`<div class="inline-answer-correction"><span>Correct:</span> <strong>${esc(expected||'—')}</strong></div>`:'';
  return `<div class="write-field ${reviewed?(wasCorrect?'inline-field-correct':'inline-field-incorrect'):''}"><div class="write-label-row"><label for="${prefix}${key}">${label} ${helper?`<span class="field-help">${helper}</span>`:''}</label>${status}</div><input class="write-input" id="${prefix}${key}" name="${prefix}${key}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${key==='pinyin'?'Type the Pinyin':'Type the meaning'}" ${reviewed?`value="${escAttr(typed||'')}" readonly aria-invalid="${!wasCorrect}"`:(disabled?'disabled':'')}>${note}</div>`;
 };
 return `<div class="chinese-write-fields ${feedback?'inline-answers-reviewed':''}">${mode!=='meaning'&&parts.pinyin?resultField('pinyin','Pinyin','(tone marks or numbers)',parts.pinyin,feedback?.pinyinRight,feedback?.pinyin):''}${mode!=='pinyin'||!parts.pinyin?resultField('meaning','English meaning','',parts.meaning,feedback?.meaningRight,feedback?.meaning):''}</div>`;
}
function choiceContentHtml(value,deck){
 const mode=data.settings.mcqDisplay||'meaning';
 if(!deck||!deck.cards.some(isChineseCard))return esc(value);
 const card=deck.cards.find(c=>solutionText(c)===value)||deck.cards.find(c=>c.term===value)||deck.cards.find(c=>c.definition===value);
 if(!card||!isChineseCard(card))return esc(value);
 const p=studyChineseParts(card),meaning=p.meaning||card.definition;
 if(mode==='pinyin')return `<span class="choice-main">${esc(p.pinyin||meaning)}</span>`;
 if(mode==='both')return `<span class="choice-main">${esc(p.pinyin||'')}</span><span class="choice-hint">${esc(meaning)}</span>`;
 return `<span class="choice-main">${esc(meaning)}</span>`;
}
function studyOptionControls(kind='write'){
 if(kind==='mc'){return `<div class="practice-options mcq-preferences"><label>MCQ answer display<select class="select compact-select" data-study-setting="mcqDisplay" aria-label="MCQ answer display"><option value="meaning" ${data.settings.mcqDisplay==='meaning'?'selected':''}>Meaning only</option><option value="pinyin" ${data.settings.mcqDisplay==='pinyin'?'selected':''}>Pinyin only</option><option value="both" ${data.settings.mcqDisplay==='both'?'selected':''}>Pinyin + meaning</option></select></label></div>`;}
 if(kind!=='write')return '';
 const mode=data.settings.writeParts||'both';
 return `<div class="practice-options write-preferences"><strong>Write answers</strong><label class="write-option"><input type="checkbox" data-write-part="pinyin" ${mode==='both'||mode==='pinyin'?'checked':''}> Require Pinyin</label><label class="write-option"><input type="checkbox" data-write-part="meaning" ${mode==='both'||mode==='meaning'?'checked':''}> Require meaning</label><span class="muted small">${mode==='random'?'Neither selected: a random one is required each question':mode==='both'?'Both selected: answer both parts':mode==='pinyin'?'Pinyin only':'Meaning only'}</span></div>`;
}
function questionChoices(card,kind='mc'){const d=getDeck(ui.session.deckId);const val=solutionText(card);let others=shuffle([...new Set(d.cards.filter(c=>c.id!==card.id).map(solutionText).filter(a=>a!==val))]);if(kind==='tf'){let yes=others.length===0||Math.random()>=.5;return {show:yes?val:others[0]||val,yes};}return shuffle([val,...others.slice(0,3)])}
function makeQuestion(){const s=ui.session;if(!s||s.pos>=s.ids.length){finishSession();return}let card=currentCard(),mode=s.mode,kind=mode==='write'?'write':mode==='listen'?'listen':mode==='blitz'?'mc':'mc';if(mode==='learn'){let kinds=data.settings.learnTypes?.length?data.settings.learnTypes:['mc'];kind=shuffle(kinds)[0];if(getDeck(s.deckId).cards.length===1&&kind==='mc')kind='write'}if(kind==='mc'&&getDeck(s.deckId).cards.length===1)kind='write';const choices=kind==='mc'?questionChoices(card):kind==='tf'?questionChoices(card,'tf'):null;s.q={kind,choices,writePart:data.settings.writeParts==='random'?(Math.random()<.5?'pinyin':'meaning'):null};s.phase='question';s.feedback=null;s.flip=false}

function answerPractice(value){const s=ui.session;if(!s||s.phase!=='question')return;let c=currentCard(),kind=s.q?.kind;let writeDetails=(kind==='write'&&chineseWriteMode(c))?gradeChineseWrite(value,c):null;let right=writeDetails?writeDetails.right:kind==='mc'?value===solutionText(c):kind==='tf'?(value==='true')===s.q.choices.yes:kind==='listen'?isCorrect(value,c,true):isCorrect(value,c);s.phase='feedback';s.feedback={right,value,writeDetails,solution:kind==='listen'?listenExpected(c):solutionText(c)};s.completed++;if(right){s.right++;cue(true)}else{s.wrong++;cue(false);if(s.mode==='learn'&&(s.attempts[c.id]||0)<2){s.ids.push(c.id);s.attempts[c.id]=(s.attempts[c.id]||0)+1}}updatePractice(c,right);if(s.mode==='blitz'&&right){nextQuestion();return}render();}
function nextQuestion(){let s=ui.session;if(!s||s.autoAdvancing)return;s.pos++;if(s.mode==='flash'||s.mode==='review'){s.flip=false;if(s.pos>=s.ids.length){finishSession();return}}else if(s.mode==='blitz'){if(s.pos>=s.ids.length){s.ids.push(...shuffle(getDeck(s.deckId).cards.map(c=>c.id)))}makeQuestion()}else{if(s.pos>=s.ids.length){finishSession();return}makeQuestion()}render()}
function previousFlash(){let s=ui.session;if(!s||s.autoAdvancing||s.pos<=0)return;s.pos--;s.flip=false;render()}

function flipFlash(){
 const session=ui.session;
 if(!session||session.autoAdvancing)return;
 session.flip=!session.flip;
 if(session.flip){
  session.revealedCards ||= {};
  const card=currentCard();
  if(card)session.revealedCards[card.id]=true;
 }
 render();
}
function gradeFlash(correct){
 const session=ui.session,card=session&&currentCard();
 if(!session||session.mode!=='flash'||session.phase==='result'||!card||session.autoAdvancing)return;
 if(correct){
  // Once the answer has been viewed, grading is immediate. Reveal for
  // one second only when Right is pressed without checking the answer.
  if(session.flip||session.revealedCards?.[card.id]){
   commitFlashGrade(true);
   return;
  }
  session.revealedCards ||= {};
  session.revealedCards[card.id]=true;
  session.autoAdvancing=true;session.flip=true;render();
  flashRevealTimer=setTimeout(()=>{flashRevealTimer=null;
   if(ui.session!==session||session.phase==='result')return;
   session.autoAdvancing=false;commitFlashGrade(true);
  },1000);
 }else commitFlashGrade(false);
}
function commitFlashGrade(correct){
 const session=ui.session,card=session&&currentCard();if(!session||session.mode!=='flash'||!card)return;
 updatePractice(card,correct);session.completed++;
 if(correct){session.right++;card.interval=Math.max(1,Math.min(30,Math.round((card.interval||1)*1.6)));card.due=Date.now()+card.interval*86400000;}
 else{session.wrong++;card.interval=0;card.due=Date.now()+60000;}
 save();nextQuestion();
}

function finishSession(){clearInterval(timerHandle);timerHandle=null;let s=ui.session;if(!s||s.phase==='result')return;s.phase='result';let total=s.right+s.wrong;if(total){data.history.push({deckId:s.deckId,mode:s.mode,correct:s.right,total,at:Date.now(),duration:Date.now()-s.start});if(data.history.length>800)data.history.splice(0,data.history.length-800)}save();render()}
function studyPage(){const s=ui.session;if(!s)return homePage();let d=getDeck(s.deckId);if(!d)return emptyDeck();if(s.phase==='result')return resultsPage(s.mode,s.right,s.wrong,s.start);let c=currentCard();if(!c)return resultsPage(s.mode,s.right,s.wrong,s.start);let isFlash=['flash','review'].includes(s.mode);let progress=s.mode==='blitz'?100*Math.max(0,60-s.blitzLeft)/60:Math.round(100*s.pos/s.ids.length);return `<div class="study-layout"><div class="crumb"><button data-act="open-deck" data-id="${d.id}">${esc(d.title)}</button>${icon('arrow')} ${esc(modeTitle(s.mode))}</div><div class="study-header"><div><div class="eyebrow">${esc(modeTitle(s.mode)).toUpperCase()}</div><h2>${esc(d.title)}</h2></div><div class="row gap-sm"><button class="btn small" data-act="restart">${icon('refresh')} <span class="hide-mobile">Restart</span></button><button class="icon-btn" data-act="open-deck" data-id="${d.id}" aria-label="Close session">${icon('close')}</button></div></div><div class="study-progress"><div class="bar"><span style="width:${progress}%"></span></div><small>${s.mode==='blitz'?`<span id="blitz-clock">${s.blitzLeft}s</span> left`:`${Math.min(s.pos+1,s.ids.length)} / ${s.ids.length}`}</small></div>${quickStudyToolbar(c)}${!isFlash&&isChineseCard(c)?(s.mode==='write'&&s.q?.kind==='write'?studyOptionControls('write'):s.mode==='mc'&&s.q?.kind==='mc'?studyOptionControls('mc'):''):''}${isFlash?flashView(s,c):questionView(s,c)}</div>`}



function questionView(s,c){let q=s.q||{},kind=q.kind,show=s.phase==='feedback';let explain=(show&&!s.feedback.writeDetails)?`<div class="feedback ${s.feedback.right?'':'bad'}" aria-live="polite"><strong>${s.feedback.right?'✓ Correct!':'✗ Not quite'}</strong>${s.feedback.writeDetails?`<div class="write-feedback-details">${s.feedback.writeDetails.hasReading?`<div class="write-result ${s.feedback.writeDetails.pinyinRight?'write-result-correct':'write-result-incorrect'}"><span>${s.feedback.writeDetails.pinyinRight?'✓':'✗'} Pinyin</span><span><em>Yours: ${esc(s.feedback.writeDetails.pinyin||'(blank)')}</em><strong>Correct: ${esc(s.feedback.writeDetails.expectedPinyin)}</strong></span></div>`:''}${s.feedback.writeDetails.hasMeaning?`<div class="write-result ${s.feedback.writeDetails.meaningRight?'write-result-correct':'write-result-incorrect'}"><span>${s.feedback.writeDetails.meaningRight?'✓':'✗'} Meaning</span><span><em>Yours: ${esc(s.feedback.writeDetails.meaning||'(blank)')}</em><strong>Accepted: ${esc(s.feedback.writeDetails.expectedMeaning)}</strong></span></div>`:''}</div>`:`<small>${kind==='write'?`You entered: ${esc(String(s.feedback.value||'(blank)'))}<br/>`:''}Correct answer: ${esc(s.feedback.solution)}${data.settings.showPinyin&&isChineseCard(c)&&studyChineseParts(c).pinyin?` · ${esc(studyChineseParts(c).pinyin)}`:''}</small>`}${c.notes?`<div class="small">${esc(c.notes)}</div>`:''}</div><div class="continue-row"><button class="btn primary study-continue" data-act="next">${s.pos+1>=s.ids.length&&s.mode!=='blitz'?'See results':'Continue'} ${icon('arrow')}</button></div>`:'';
return `<div class="study-area"><div class="inline-card question-surface"><button class="icon-btn in-card-star ${c.starred?'active':''}" data-act="star" data-id="${c.id}" aria-label="${c.starred?'Unstar':'Star'} this term" title="Star term (F)">${icon('star')}</button><div class="question-heading">${kind==='listen'?'Listen and type what you hear':kind==='tf'?'Is this a correct pair?':data.settings.direction==='forward'?'What does this mean?':'Which term matches?'} </div>${kind==='listen'?`<div class="center" style="padding:22px 0"><button class="btn soft" data-act="speak" data-id="${c.id}" style="width:96px;height:96px;border-radius:50%">${icon('speaker')}</button><p class="muted small" style="margin-top:15px">Tap to play the term aloud</p></div>`:`<div class="question-word">${esc(promptText(c))}</div>${pinyinHintHtml(c,'question-sub',data.settings.direction==='forward')}`}${kind==='mc'?`<div class="answers-grid">${q.choices.map((x,i)=>`<button class="option ${show?(x===solutionText(c)?'correct':x===s.feedback.value?'incorrect':''):''}" data-act="answer" data-value="${escAttr(x)}" ${show?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${choiceContentHtml(x,getDeck(s.deckId))}</span></button>`).join('')}</div>`:kind==='tf'?`<div class="surface center" style="background:var(--bg);margin:24px 0;padding:23px"><span class="muted small">Proposed answer</span><div style="font-size:24px;font-weight:750;margin-top:9px">${esc(q.choices.show)}${pinyinForShownAnswer(q.choices.show,getDeck(s.deckId))}</div></div><div class="answers-grid tf-answers">${['false','true'].map(x=>`<button class="option ${show?((x==='true')===q.choices.yes?'correct':x===s.feedback.value?'incorrect':''):''}" data-act="answer" data-value="${x}" ${show?'disabled':''}>${x==='true'?icon('check'):icon('close')} ${x==='true'?'True':'False'}</button>`).join('')}</div>`:`<form id="answer-form">${kind==='write'&&chineseWriteMode(c)?chineseWriteFields(c,show,null,show?s.feedback.writeDetails:null):`<label for="answer-text" class="muted small">${kind==='listen'?(data.settings.listenPinyin&&c.pinyin?'Type the optional transcription':'Type what you heard'):'Type your answer'}</label><input class="write-input" id="answer-text" name="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Your answer…" ${show?'disabled':''} style="margin:10px 0"/>`}<div class="row" style="justify-content:flex-end">${show&&s.feedback.writeDetails?`<div class="inline-feedback-actions"><span class="inline-summary ${s.feedback.right?'ok':'partial'}" aria-live="polite">${s.feedback.right?'✓ Correct':'✕ Review highlighted answer'}${s.feedback.writeDetails.hasReading&&s.feedback.writeDetails.hasMeaning&&!s.feedback.right?` · ${Number(s.feedback.writeDetails.pinyinRight)+Number(s.feedback.writeDetails.meaningRight)}/2 correct`:''}</span><button class="btn primary study-continue" type="button" data-act="next">${s.pos+1>=s.ids.length&&s.mode!=='blitz'?'See results':'Continue'} ${icon('arrow')}</button></div>`:`<button class="btn primary" type="submit" ${show?'disabled':''}>Check answer ${icon('check')}</button>`}</div></form>`}${explain}</div><div class="center muted small" style="margin-top:20px">${s.right} correct · ${s.wrong} to practise again ${s.mode==='blitz'?'· Time matters!':''}</div></div>`}
function resultsPage(mode,right,wrong,start,extra=''){const total=right+wrong,pct=total?Math.round(right*100/total):0,seconds=Math.max(0,Math.round((Date.now()-start)/1000));return `<div class="study-layout"><div class="surface center" style="padding:36px 26px"><div class="trophy">${pct>=80?'🏆':pct>=50?'🌟':'💪'}</div><div class="eyebrow" style="margin-top:12px">SESSION COMPLETE</div><h1 style="margin:9px 0">${pct>=80?'Great work!':pct>=50?'Keep it going!':'Practice makes progress.'}</h1><p class="muted">${esc(modeTitle(mode))} · ${esc(getDeck()?.title||'Study set')}</p><div class="result-score">${pct}%</div><div class="result-metrics"><div><strong>${right}</strong><small>Correct</small></div><div><strong>${wrong}</strong><small>Incorrect</small></div><div><strong>${seconds}s</strong><small>Elapsed</small></div></div>${extra}<div class="row wrap" style="justify-content:center;margin-top:22px"><button class="btn primary" data-act="restart">${icon('refresh')} Study again</button><button class="btn" data-act="open-deck" data-id="${ui.deckId}">Return to set</button></div></div></div>`}




function testPage(){let t=ui.test;if(!t)return deckPage();let d=getDeck(t.deckId);if(t.submitted)return testResultsPage(t);if(!t.questions.length)return `<div class="study-layout"><div class="crumb"><button data-act="open-deck" data-id="${d.id}">${esc(d.title)}</button>${icon('arrow')} Practice test</div><div class="row" style="margin-bottom:14px">${d.cards.some(c=>isChineseCard(c))?`<button class="quick-tool ${data.settings.showPinyin?'is-on':''}" data-act="quick-pinyin" type="button" aria-pressed="${!!data.settings.showPinyin}">拼 Pinyin ${data.settings.showPinyin?'on':'off'}</button>`:''}</div><div class="surface"><div class="eyebrow">BUILD YOUR EXAM</div><h1>Practice test</h1><p class="muted">Choose the number and style of questions. This is completely free.</p><div class="field"><label>Questions (maximum ${d.cards.length})</label><input class="input" type="number" min="1" max="${d.cards.length}" value="${t.count}" id="test-count"/></div><strong>Include question types</strong><div class="switch-row"><span>Multiple choice</span><input type="checkbox" class="test-type" value="mc" checked/></div><div class="switch-row"><span>Written answers</span><input type="checkbox" class="test-type" value="write" checked/></div><div class="switch-row"><span>True or false</span><input type="checkbox" class="test-type" value="tf" checked/></div><div style="margin-top:21px"><button class="btn primary" data-act="create-test">Start test ${icon('arrow')}</button></div></div></div>`;return `<div class="study-layout"><div class="crumb"><button data-act="open-deck" data-id="${d.id}">${esc(d.title)}</button>${icon('arrow')} Practice test</div><div class="row" style="margin-bottom:14px">${d.cards.some(c=>isChineseCard(c))?`<button class="quick-tool ${data.settings.showPinyin?'is-on':''}" data-act="quick-pinyin" type="button" aria-pressed="${!!data.settings.showPinyin}">拼 Pinyin ${data.settings.showPinyin?'on':'off'}</button>`:''}</div><div class="heading-row"><div><div class="eyebrow">YOUR EXAM</div><h1>Practice test</h1><p class="muted">${t.questions.length} questions · Take your time</p></div><button class="btn" data-act="reset-test">Reset</button></div><form id="test-form">${t.questions.map((q,i)=>{let c=getCard(q.cardId,d);return `<div class="test-item"><div class="eyebrow">QUESTION ${i+1} · ${q.kind==='mc'?'MULTIPLE CHOICE':q.kind==='tf'?'TRUE OR FALSE':'WRITTEN'}</div><h3>${esc(promptText(c))}</h3>${pinyinHintHtml(c,'pinyin',data.settings.direction==='forward')}${q.kind==='tf'?`<p class="pill">Proposed: ${esc(q.choices.show)}${pinyinForShownAnswer(q.choices.show,d)}</p>`:''}${q.kind==='write'?(chineseWriteMode(c)?chineseWriteFields(c,false,i):`<input class="input" name="a_${i}" placeholder="Type your answer" autocomplete="off"/>`):`<div class="test-choices ${q.kind==='tf'?'tf-choices':''}">${(q.kind==='mc'?q.choices:['false','true']).map((x,k)=>`<label><input type="radio" name="a_${i}" value="${escAttr(x)}"/><span>${q.kind==='tf'?(x==='true'?'True':'False'):choiceContentHtml(x,d)}</span></label>`).join('')}</div>`}</div>`}).join('')}<button class="btn primary" type="submit" style="width:100%;margin-top:10px">Submit test & see results ${icon('check')}</button></form></div>`}
function createTest(){const t=ui.test,d=getDeck(t.deckId);let count=Math.max(1,Math.min(d.cards.length,Number($('#test-count')?.value)||10)),types=[...document.querySelectorAll('.test-type:checked')].map(e=>e.value);if(!types.length){toast('Choose at least one question type.');return}t.count=count;t.types=types;t.questions=shuffle(d.cards).slice(0,count).map(c=>{let kind=shuffle(types)[0];if(kind==='mc'&&d.cards.length<2)kind='write';return {cardId:c.id,kind,writePart:data.settings.writeParts==='random'?(Math.random()<.5?'pinyin':'meaning'):null,choices:kind==='mc'?testOptions(c,d):kind==='tf'?testTF(c,d):null}});t.started=Date.now();render()}
function testOptions(card,d){let v=solutionText(card),o=shuffle([...new Set(d.cards.filter(c=>c.id!==card.id).map(solutionText).filter(x=>x!==v))]);return shuffle([v,...o.slice(0,3)])}
function testTF(card,d){let o=d.cards.filter(c=>c.id!==card.id),yes=!o.length||Math.random()>=.5;return {yes,show:yes?solutionText(card):solutionText(shuffle(o)[0])}}
function submitTest(form){let t=ui.test,d=getDeck(t.deckId),fd=new FormData(form),right=0;let review=[];t.questions.forEach((q,i)=>{let c=getCard(q.cardId,d),v=String(fd.get(`a_${i}`)||'');let details=q.kind==='write'&&chineseWriteMode(c)?gradeChineseWrite({pinyin:fd.get(`a_${i}_pinyin`),meaning:fd.get(`a_${i}_meaning`)},c):null;let ok=details?details.right:q.kind==='mc'?v===solutionText(c):q.kind==='tf'?(v==='true')===q.choices.yes&&v!=='':isCorrect(v,c);right+=ok?1:0;updatePractice(c,ok);review.push({q,card:c,answer:details?`Pinyin: ${details.pinyin||'(blank)'} · Meaning: ${details.meaning||'(blank)'}`:v,details,ok})});t.submitted=true;t.result={right,wrong:t.questions.length-right,review};data.history.push({deckId:d.id,mode:'test',correct:right,total:t.questions.length,at:Date.now(),duration:Date.now()-t.started});save();render()}
function testResultsPage(t){let r=t.result,d=getDeck(t.deckId);return `<div class="study-layout"><div class="surface center"><div class="trophy">${r.right>=t.questions.length*.8?'🏆':'📚'}</div><div class="eyebrow">TEST RESULTS</div><h1>${Math.round(100*r.right/t.questions.length)}% score</h1><p class="muted">${r.right} correct out of ${t.questions.length}</p><div class="row wrap" style="justify-content:center"><button class="btn primary" data-act="reset-test">Take another test</button><button class="btn" data-act="open-deck" data-id="${d.id}">Back to set</button></div></div><h2 style="margin-top:25px">Review your answers</h2>${r.review.map((a,i)=>`<div class="test-item"><div class="row space-between"><strong>Question ${i+1}</strong><span class="pill ${a.ok?'green':'red'}">${a.ok?'Correct':'Incorrect'}</span></div><h3 style="margin-top:12px">${esc(promptText(a.card))}</h3>${pinyinHintHtml(a.card,'pinyin',data.settings.direction==='forward')}<div class="muted small">Your answer: ${esc(a.answer||'(blank)')}</div>${a.details?`<div class="write-feedback-details test-write-feedback">${a.details.hasReading?`<div class="write-result ${a.details.pinyinRight?'write-result-correct':'write-result-incorrect'}"><span>${a.details.pinyinRight?'✓':'✗'} Pinyin</span><strong>${esc(a.details.expectedPinyin)}</strong></div>`:''}${a.details.hasMeaning?`<div class="write-result ${a.details.meaningRight?'write-result-correct':'write-result-incorrect'}"><span>${a.details.meaningRight?'✓':'✗'} Meaning</span><strong>${esc(a.details.expectedMeaning)}</strong></div>`:''}</div>`:`<div class="small" style="color:var(--green);margin-top:6px">Correct answer: ${esc(solutionText(a.card))}${data.settings.direction==='reverse'?pinyinForShownAnswer(solutionText(a.card),d):''}</div>`}</div>`).join('')}</div>`}

function playSpeech(word,lang){if(!word)return;if(!('speechSynthesis'in window)){toast('Speech is not supported by this browser.');return}try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(word);u.lang=lang||'en-US';u.rate=.85;let voices=speechSynthesis.getVoices();let v=voices.find(v=>v.lang.toLowerCase().startsWith((lang||'en').slice(0,2).toLowerCase())&&v.localService)||voices.find(v=>v.lang.toLowerCase().startsWith((lang||'en').slice(0,2).toLowerCase()));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){toast('Pronunciation unavailable on this device.')}}
let audioCtx;function cue(ok){if(!data.settings.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioCtx=audioCtx||new C();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=ok?660:230;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.16);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.17)}catch(e){}}
function renderModal(){const root=$('#modal-root');if(!ui.modal){root.innerHTML='';return}
 if(ui.modal==='delete-confirm'){
   const p=ui.pendingDelete;
   if(!p){ui.modal='';root.innerHTML='';return;}
   const heading=p.kind==='decks'?(p.ids.length===1?'Delete this study set?':`Delete ${p.ids.length} study sets?`):p.kind==='card'?'Delete this flashcard?':'Delete this sentence exercise?';
   const description=p.kind==='decks'?
     (p.ids.length===1?`“${esc(p.names[0])}” and its saved progress will be removed from this device.`:`${p.ids.length} study sets containing ${p.cardCount} flashcards and their saved progress will be removed from this device.`):
     p.kind==='card'?`“${esc(p.title)}” will be removed from this study set.`:'This sentence exercise and its learning progress will be removed. Your flashcards will stay.';
   root.innerHTML=`<div class="modal-backdrop" data-act="close-modal" role="presentation"><section class="modal delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-warning" data-no-close="1"><div class="delete-warning-icon" aria-hidden="true">!</div><h2 id="delete-title">${heading}</h2><p id="delete-warning" class="delete-description">${description}</p><p class="delete-caution">This cannot be undone. Export a backup first if you might need it.</p><div class="delete-actions"><button class="btn delete-cancel" type="button" data-act="cancel-delete">Cancel</button><button class="btn delete-confirm-button" type="button" data-act="confirm-delete" disabled aria-label="Confirm permanent deletion">Delete</button></div><p class="delete-hint">Cancel is the safe default. The red button unlocks after a brief pause.</p></section></div>`;
   root.querySelector('[data-act="cancel-delete"]')?.focus();
   const token=p.token;
   window.setTimeout(()=>{if(ui.modal==='delete-confirm'&&ui.pendingDelete?.token===token){const b=root.querySelector('[data-act="confirm-delete"]');if(b)b.disabled=false;}},900);
   return;
 }
let d=getDeck(),c=ui.editing?getCard(ui.editing):null,body='';if(ui.modal==='help'){body=`<div class="modal-heading"><div><h2>Keyboard shortcuts</h2><p class="muted small">You can study without the mouse. Shortcuts do not interrupt typing.</p></div><button class="icon-btn" data-act="close-modal">${icon('close')}</button></div>${[['X / C','Mark flashcard Wrong / Right'],['Space','Flip current card'],['← / →','Previous / next flashcard'],['1–4','Choose multiple-choice option'],['Enter','Continue after feedback / check written answer'],['F','Star or unstar the current card'],['R','Shuffle the current flashcard session'],['S','Speak when pronunciation is enabled'],['Alt + P','Show / hide Pinyin hints'],['?','Show keyboard help'],['Esc','Close this window']].map(([k,v])=>`<div class="hist-row"><span>${v}</span><span class="kbd">${k}</span></div>`).join('')}`;}else if(ui.modal==='deck'){let ed=ui.editing==='deck',set=ed?d:null;body=`<div class="modal-heading"><div><h2>${ed?'Edit study set':'Create a study set'}</h2><p class="muted small">Organize your cards and give them a home.</p></div><button class="icon-btn" data-act="close-modal">${icon('close')}</button></div><form id="deck-form"><div class="field"><label>Title *</label><input class="input" name="title" required maxlength="140" placeholder="e.g. Economics — Chapter 1" value="${escAttr(set?.title||'')}"/></div><div class="field"><label>Description</label><textarea class="textarea" name="description" placeholder="What will you learn?" style="min-height:70px">${esc(set?.description||'')}</textarea></div><div class="two-cols"><div class="field"><label>Folder</label><input class="input" name="folder" placeholder="e.g. University" value="${escAttr(set?.folder||'')}"/></div><div class="field"><label>Subject</label><select class="select" name="subject">${['Languages','Science','Math','History','Business','General','Other'].map(x=>`<option ${x===(set?.subject||'General')?'selected':''}>${x}</option>`).join('')}</select></div></div>${data.settings.showPronunciation?`<div class="field"><label>Speech language</label><select class="select" name="lang">${[['zh-CN','Chinese (Mandarin)'],['en-US','English (US)'],['hi-IN','Hindi'],['fr-FR','French'],['es-ES','Spanish'],['de-DE','German'],['ja-JP','Japanese'],['ko-KR','Korean'],['it-IT','Italian'],['other','Other / device default']].map(([k,x])=>`<option value="${k}" ${k===(set?.lang||'en-US')?'selected':''}>${x}</option>`).join('')}</select></div>`:''}<div class="modal-footer"><button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit">${ed?'Save changes':'Create set'}</button></div></form>`}else if(ui.modal==='card'){let ed=!!c;body=`<div class="modal-heading"><div><h2>${ed?'Edit flashcard':'Add a flashcard'}</h2><p class="muted small">Make cards about any subject. Add optional details only if you need them.</p></div><button class="icon-btn" data-act="close-modal">${icon('close')}</button></div><form id="card-form"><div class="field"><label>Term *</label><input class="input" name="term" required placeholder="e.g. Opportunity cost" value="${escAttr(c?.term||'')}"/></div><div class="field"><label>Definition *</label><textarea class="textarea" name="definition" required placeholder="Value of the next best alternative forgone" style="min-height:70px">${esc(c?.definition||'')}</textarea></div><div class="two-cols"><div class="field"><label>${(c&&isChineseCard(c))||(d&&isMandarinDeck(d))?'Pinyin reading (back + optional front hint)':'Optional transcription / Pinyin'}</label><input class="input" name="pinyin" placeholder="e.g. nǐ hǎo · optional" value="${escAttr(c?.pinyin||'')}"/><div class="muted small">Show Pinyin adds optional hints on the front; backs always show Pinyin and meaning.</div></div><div class="field"><label>Other accepted answers (use | to separate)</label><input class="input" name="accepted" placeholder="Alternative definition | Synonym" value="${escAttr(c?.accepted||'')}"/></div></div><div class="field"><label>Extra notes / explanation</label><textarea class="textarea" name="notes" placeholder="Example, grammar note, memory aid…" style="min-height:72px">${esc(c?.notes||'')}</textarea></div><div class="field"><label>Optional image (saved locally; small files recommended)</label><input class="input" type="file" id="card-image" accept="image/png,image/jpeg,image/webp,image/gif"/></div>${c?.image?`<div class="row"><img alt="Current card image" src="${safeImage(c.image)}" style="height:65px;border-radius:8px"/><button class="btn danger small" data-act="remove-card-image" type="button">Remove image</button></div>`:''}<div class="modal-footer">${ed?`<button type="button" class="btn danger" data-act="delete-card" data-id="${c.id}" style="margin-right:auto">Delete term</button>`:''}<button type="button" class="btn" data-act="close-modal">Cancel</button><button class="btn primary" type="submit">${ed?'Save term':'Add card'}</button></div></form>`}else if(ui.modal==='export'){body=`<div class="modal-heading"><div><h2>Export your set</h2><p class="muted small">Share your vocabulary between phones and computers.</p></div><button class="icon-btn" data-act="close-modal">${icon('close')}</button></div><p><strong>${esc(d?.title||'Study set')}</strong> · ${d?.cards.length||0} cards</p><div class="row wrap"><button class="btn primary" data-act="download-deck-json">${icon('download')} Study set JSON</button><button class="btn" data-act="download-deck-csv">${icon('download')} CSV / Excel</button><button class="btn" data-act="copy-deck">Copy as text</button></div><p class="muted small" style="margin-top:19px">JSON keeps card progress, stars, notes and images. CSV is ideal for sharing vocabulary with other apps.</p>`}root.innerHTML=`<div class="modal-backdrop" data-act="close-modal" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="${escAttr(ui.modal)}" data-no-close="1">${body}</div></div>`;root.querySelector('.input')?.focus()}
function safeImage(s){return /^data:image\/(png|jpeg|webp|gif);base64,/i.test(s||'')?escAttr(s):''}
function closeModal(){ui.modal='';ui.editing='';ui.pendingDelete=null;pendingFileImage=null;renderModal()}
function requestDelete(kind, ids){
 let p={kind,requestedAt:Date.now(),token:uid()};
 if(kind==='decks'){
  const list=data.decks.filter(d=>ids.includes(d.id));if(!list.length)return;
  p.ids=list.map(d=>d.id);p.names=list.map(d=>d.title);p.cardCount=list.reduce((n,d)=>n+(d.cards?.length||0),0);
 }else if(kind==='card'){
  const deck=getDeck(),card=deck?.cards?.find(c=>c.id===ids);
  if(!card)return;p.id=card.id;p.deckId=deck.id;p.title=card.term;p.fromCardEditor=ui.modal==='card';
 }else if(kind==='sentence'){
  const item=initLabData().custom.find(x=>x.id===ids);if(!item)return;p.id=item.id;p.title=item.source;
 }else return;
 ui.pendingDelete=p;ui.modal='delete-confirm';renderModal();
}
function cancelDelete(){const p=ui.pendingDelete;ui.pendingDelete=null;if(p?.fromCardEditor){ui.modal='card';ui.editing=p.id;renderModal()}else closeModal()}
function confirmDelete(){
 const p=ui.pendingDelete;
 if(ui.modal!=='delete-confirm'||!p||Date.now()-p.requestedAt<850)return;
 const button=$('#modal-root [data-act="confirm-delete"]');if(!button||button.disabled)return;
 button.disabled=true;
 ui.pendingDelete=null;ui.modal='';ui.editing='';renderModal();
 if(p.kind==='decks')performDeckDeletion(p.ids);
 else if(p.kind==='card'){
  const deck=data.decks.find(d=>d.id===p.deckId);if(!deck)return;
  deck.cards=deck.cards.filter(c=>c.id!==p.id);
  save();render();toast('Flashcard deleted.');
 }else if(p.kind==='sentence'){
  const lab=initLabData();lab.custom=lab.custom.filter(x=>x.id!==p.id);delete lab.skills[p.id];save();render();toast('Sentence exercise deleted.');
 }
}

function formDeck(fd){let title=String(fd.get('title')||'').trim();if(!title){toast('A title is required.');return}let ed=ui.editing==='deck',d=ed?getDeck():{id:uid(),created:Date.now(),cards:[]};d.title=title;d.description=String(fd.get('description')||'').trim();d.folder=String(fd.get('folder')||'').trim();d.subject=String(fd.get('subject')||'General');d.lang=String(fd.get('lang')||d.lang||'en-US');if(!ed)data.decks.unshift(d);ui.deckId=d.id;ui.q='';save();closeModal();nav('deck');toast(ed?'Study set updated.':'New study set created.')}
async function fileDataUrl(file){if(!file)return null;if(file.size>1.5*1024*1024)throw Error('Image is too large. Please choose one smaller than 1.5 MB.');if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF.');return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(Error('Could not read the image.'));r.readAsDataURL(file)})}
async function formCard(fd){let term=String(fd.get('term')||'').trim(),definition=String(fd.get('definition')||'').trim();if(!term||!definition){toast('Both term and definition are required.');return}let d=getDeck(),c=ui.editing?getCard(ui.editing):null;try{let f=$('#card-image')?.files?.[0],img=f?await fileDataUrl(f):null;if(!c){c=mkCard(term,definition);d.cards.push(c)}c.term=term;c.definition=definition;c.pinyin=String(fd.get('pinyin')||'').trim();normalizeChineseCard(c);c.accepted=String(fd.get('accepted')||'').trim();c.notes=String(fd.get('notes')||'').trim();if(img)c.image=img;if(pendingFileImage==='remove')c.image='';save();closeModal();render();toast('Flashcard saved.')}catch(e){toast(e.message||'Could not save card.')}}
function filenameSafe(s){return String(s).normalize('NFKD').replace(/[^a-z0-9_-]+/gi,'_').slice(0,54)||'flashcards'}
function download(name,body,mime){const blob=new Blob([body],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000)}
function backup(){data.lastBackupAt=Date.now();data.backupSnoozedUntil=0;save();download('recall_studio_full_backup_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(data,null,2),'application/json');render();toast('Backup download started. Keep your JSON file somewhere safe.')}
function downloadDeck(json){let d=getDeck();if(!d)return;
 if(json){download(filenameSafe(d.title)+'.json',JSON.stringify({version:6,type:'recall-studio-deck',deck:d,languageExamples:(data.languageLab?.custom||[]).filter(x=>x.deckId===d.id)},null,2),'application/json')}
 else{
  const quote=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  const chinese=isMandarinDeck(d);
  const columns=chinese?['Front','Back','Pinyin','Notes','Accepted answers']:['Term','Definition','Notes','Accepted answers'];
  const lines=[columns.map(quote).join(',')];
  for(const c of d.cards){const parts=chineseCardParts(c);const fields=chinese?[c.term,parts.pinyin?parts.pinyin+' — '+parts.meaning:parts.meaning,parts.pinyin,c.notes,c.accepted]:[c.term,c.definition,c.notes,c.accepted];lines.push(fields.map(quote).join(','))}
  download(filenameSafe(d.title)+'.csv','\ufeff'+lines.join('\r\n'),'text/csv;charset=utf-8')
 }
 closeModal();toast('Study set exported.');
}
function validateDeck(d){if(!d||typeof d!=='object'||!Array.isArray(d.cards))throw Error('File does not contain a valid study set.');let newDeck={id:uid(),title:String(d.title||'Imported set').slice(0,140),description:String(d.description||''),folder:String(d.folder||''),subject:String(d.subject||'General'),lang:String(d.lang||'en-US'),created:Date.now(),cards:[]};newDeck.cards=d.cards.filter(x=>x&&x.term!=null&&x.definition!=null).map(c=>({...mkCard(c.term,c.definition,c.pinyin||'',c.notes||''),accepted:String(c.accepted||''),image:/^data:image\/(png|jpeg|webp|gif);base64,/i.test(c.image||'')?c.image:'',starred:!!c.starred,correct:Number(c.correct)||0,wrong:Number(c.wrong)||0,streak:Number(c.streak)||0,ease:Number(c.ease)||2.5,interval:Number(c.interval)||0,due:Number(c.due)||0,lastReviewed:Number(c.lastReviewed)||0})).map(normalizeChineseCard);return newDeck}
function importJSON(text){let obj=JSON.parse(text);if(obj.type==='recall-studio-deck'||(obj.cards&&!obj.decks)){let d=validateDeck(obj.deck||obj);data.decks.unshift(d);if(Array.isArray(obj.languageExamples)){const l=initLabData();for(const x of obj.languageExamples){if(x&&x.source&&x.target)l.custom.push({...x,id:uid(),deckId:d.id})}}ui.deckId=d.id;save();nav('deck');toast(`Imported ${d.cards.length} cards.`);return}if(Array.isArray(obj.decks)){if(!confirm('Restore this full backup? This REPLACES all current decks, history and settings on this device. Export your current backup first if needed.'))return;let imported=obj.decks.map(d=>{const n=validateDeck(d);n.id=String(d.id||n.id);if(d.cards?.length===n.cards.length)n.cards=n.cards.map((c,i)=>({...c,id:String(d.cards[i].id||c.id)}));return n});data=normalizeData({...initial(),chineseClassNotesImportedV1:obj.chineseClassNotesImportedV1===true,chineseClassNotesImportedV2:obj.chineseClassNotesImportedV2===true,decks:imported,chineseNumbersSeparatedV1:obj.chineseNumbersSeparatedV1===true,numberLibraryReconciledV1:obj.numberLibraryReconciledV1===true,settings:{...initial().settings,...obj.settings,showPronunciation:obj.settings?.showPronunciation===true},history:Array.isArray(obj.history)?obj.history:[],mistakeLog:Array.isArray(obj.mistakeLog)?obj.mistakeLog:[],arcadeBest:obj.arcadeBest||{},bestMatch:obj.bestMatch||{},languageLab:obj.languageLab||{},chineseNumbers:obj.chineseNumbers||{},createdAt:Number(obj.createdAt)||Date.now(),lastBackupAt:Number(obj.lastBackupAt)||0});const ids=new Map(obj.decks.map((d,i)=>[d.id,imported[i].id]));data.history=data.history.map(h=>({...h,deckId:ids.get(h.deckId)||h.deckId}));ui.deckId=data.decks[0]?.id||'';save();nav('library');toast('Full backup restored.');return}throw Error('Unrecognized JSON backup format.')}
function parseDelimited(text){const first=String(text).trim().split(/\r?\n/,1)[0]||'';const delim=first.includes('\t')?'\t':first.includes(',')?',':first.includes('|')?'|':'\t';let rows=[],row=[],field='',quote=false;for(let i=0;i<text.length;i++){let x=text[i];if(x==='"'){if(quote&&text[i+1]==='"'){field+='"';i++}else quote=!quote}else if(x===delim&&!quote){row.push(field);field=''}else if((x==='\n'||x==='\r')&&!quote){if(x==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field=''}else field+=x}row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 rows=rows.map(r=>r.map(x=>x.trim())).filter(r=>r[0]&&r[1]);
 const hasHeader=rows.length>0&&/^(term|word|front|question|character)$/i.test(rows[0][0])&&/^(definition|meaning|back|answer)$/i.test(rows[0][1]);
 const headers=hasHeader?rows.shift().map(h=>h.toLowerCase()):null;
 return {rows,headers};
}
function importText(text,title='Imported flashcards',folder=''){
 if(text.trim().startsWith('{')){importJSON(text);return}
 const {rows,headers}=parseDelimited(text);
 if(!rows.length){toast('No cards found. Separate term and definition with a Tab or CSV comma.');return}
 const findHeader=(names)=>headers?headers.findIndex(h=>names.includes(h)):-1;
 const notesIdx=findHeader(['notes','note','explanation']);
 const transcriptionIdx=findHeader(['pinyin','transcription','pronunciation','romanization']);
 const acceptedIdx=findHeader(['accepted answers','accepted','alternatives']);
 const cards=rows.map(row=>{
   const [term,def]=row;
   const pinyin=transcriptionIdx>=0?row[transcriptionIdx]||'':!headers&&data.settings.showPronunciation?row[2]||'':'';
   const notes=notesIdx>=0?row[notesIdx]||'':!headers?(data.settings.showPronunciation?row[3]:row[2])||'':'';
   const accepted=acceptedIdx>=0?row[acceptedIdx]||'':!headers?(data.settings.showPronunciation?row[4]:row[3])||'':'';
   const c=mkCard(term,def,pinyin,notes);c.accepted=accepted;return normalizeChineseCard(c);
 });
 let d={id:uid(),title:title||'Imported flashcards',description:'Imported into Recall Studio',folder,subject:'Languages',lang:cards.some(c=>isChineseCard(c))?'zh-CN':'en-US',created:Date.now(),cards};
 data.decks.unshift(d);ui.deckId=d.id;save();nav('deck');toast(`Imported ${d.cards.length} cards. Ready to study!`);
}
async function importFile(file){if(!file)return;try{if(file.size>8*1024*1024)throw Error('Please use a file smaller than 8 MB.');const text=await file.text();if(file.name.toLowerCase().endsWith('.json'))importJSON(text);else importText(text,file.name.replace(/\.[^.]+$/,''),$('#import-folder')?.value||'');}catch(e){toast('Import failed: '+(e.message||'Invalid file'))}}
function deleteDecksByIds(ids){requestDelete('decks',ids)}
function performDeckDeletion(ids){
 const targets=data.decks.filter(d=>ids.includes(d.id));
 if(!targets.length)return;
 const gone=new Set(targets.map(d=>d.id));
 data.decks=data.decks.filter(d=>!gone.has(d.id));
 data.history=data.history.filter(h=>!gone.has(h.deckId));
 data.mistakeLog=(data.mistakeLog||[]).filter(m=>!gone.has(m.deckId));
 for(const id of gone){delete data.bestMatch[id];for(const k of Object.keys(data.arcadeBest||{}))if(k.startsWith(id+':'))delete data.arcadeBest[k]}
 ui.libraryFilters.selected=ui.libraryFilters.selected.filter(id=>!gone.has(id));
 ui.libraryFilters.selectMode=false;
 if(gone.has(ui.deckId))ui.deckId=data.decks[0]?.id||'';
 if(data.decks.every(d=>d.folder!==ui.filter))ui.filter='all';
 save();nav('library');toast(`${targets.length} study ${targets.length===1?'set':'sets'} deleted.`);
}
function removeDeck(id=ui.deckId){deleteDecksByIds([id])}

function removeCard(id){requestDelete('card',id)}
function copyDeck(){let d=getDeck(),txt=d.cards.map(c=>(data.settings.showPronunciation?[c.term,c.definition,c.pinyin]:[c.term,c.definition]).filter(Boolean).join('\t')).join('\n');if(navigator.clipboard?.writeText){navigator.clipboard.writeText(txt).then(()=>toast('Cards copied to clipboard.')).catch(()=>toast('Clipboard permission denied; try exporting a CSV.'))}else toast('Clipboard is not supported; export a CSV instead.')}

/* v3 — independent local games, per-deck stats and mistake replay. No network dependencies. */
function learningCards(d){return d.cards.filter(c=>(c.correct||0)+(c.wrong||0)>0&&mastery(c)<100)}
function setMetrics(d){const right=d.cards.reduce((n,c)=>n+(c.correct||0),0),wrong=d.cards.reduce((n,c)=>n+(c.wrong||0),0);return {right,wrong,accuracy:right+wrong?Math.round(right*100/(right+wrong)):null,mastered:d.cards.filter(c=>mastery(c)>=100).length,learning:learningCards(d).length,unseen:d.cards.filter(c=>!(c.correct||c.wrong)).length,starred:d.cards.filter(c=>c.starred).length}}
function recentMistakes(d){return (data.mistakeLog||[]).filter(m=>!d||m.deckId===d.id).slice(-10).reverse()}
function shortTerms(s,n=48){s=String(s??'');return s.length>n?s.slice(0,n-1)+'…':s}
function deckCard(d){
 const p=deckMastery(d),m=setMetrics(d),inLibrary=ui.page==='library',selecting=inLibrary&&ui.libraryFilters.selectMode,selected=ui.libraryFilters.selected.includes(d.id);
 const title=esc(d.title),id=escAttr(d.id);
 return `<article class="deck-card ${selected?'deck-selected':''} ${selecting?'deck-selecting':''}" data-act="${selecting?'select-deck':'open-deck'}" data-id="${id}" tabindex="0" role="button" aria-label="${selecting?(selected?'Deselect ':'Select '):'Open '}${escAttr(d.title)}">
   <div class="row space-between deck-card-head"><span class="deck-icon">📚</span>
   <span class="row gap-sm" style="margin-left:auto">${inLibrary?selecting?`<span class="selection-indicator ${selected?'selected':''}" aria-hidden="true">${selected?'✓':''}</span>`:`<button type="button" class="deck-trash" data-act="delete-deck-id" data-id="${id}" title="Delete ${escAttr(d.title)}" aria-label="Delete ${escAttr(d.title)}">${icon('trash')}</button>`:''}<span class="pill">${esc(d.subject||'General')}</span></span></div>
   <div class="grow"><h3>${title}</h3><div class="deck-meta">${icon('cards')} ${d.cards.length} terms ${d.folder?`· ${esc(d.folder)}`:''}</div></div>
   <div class="row space-between small"><span class="muted">Mastery</span><strong>${p}%</strong></div><div class="bar"><span style="width:${p}%"></span></div>
   </article>`;
}

function cardWrongRate(c){const t=(c.correct||0)+(c.wrong||0);return t?Math.round(100*(c.wrong||0)/t):0}
function detailedWrongRows(cards,limit=20){
 const order=ui.analyticsSort||'wrong',direction=ui.analyticsDir||'desc',onlyMissed=ui.analyticsOnlyMissed!==false;
 const all=cards.filter(c=>!onlyMissed||Number(c.wrong)>0).slice();
 const score=c=>order==='wrong'?Number(c.wrong||0):order==='missrate'?cardWrongRate(c):order==='correct'?Number(c.correct||0):order==='attempts'?Number(c.correct||0)+Number(c.wrong||0):order==='recent'?Number(c.lastReviewed||0):mastery(c);
 all.sort((a,b)=>(score(b)-score(a))*(direction==='asc'?-1:1)||String(a.term).localeCompare(String(b.term)));
 const ranked=all.slice(0,limit);
 return ranked.length?ranked.map(c=>`<div class="wrong-detail-row"><div class="wrong-term"><strong>${esc(shortTerms(c.term,35))}</strong><span class="small muted">${esc(shortTerms(isChineseCard(c)?studyChineseParts(c).meaning:c.definition,60))}</span></div><div class="wrong-count"><strong>${c.wrong||0} wrong</strong><span class="small muted">${cardWrongRate(c)}% missed · ${c.correct||0} correct · ${(c.correct||0)+(c.wrong||0)} attempts</span></div></div>`).join(''):'<p class="muted small">Nothing to show for this filter.</p>';
}
function analyticsControls(){const option=(v,title)=>`<option value="${v}" ${ui.analyticsSort===v?'selected':''}>${title}</option>`;return `<div class="analytics-filters"><label>Sort metric<select class="select" data-analytics-sort>${option('wrong','Wrong answers')}${option('missrate','Miss rate (%)')}${option('correct','Correct answers')}${option('attempts','Total attempts')}${option('recent','Recently practised')}${option('mastery','Mastery')}</select></label><label>Order<select class="select" data-analytics-dir><option value="desc" ${ui.analyticsDir==='desc'?'selected':''}>Highest first</option><option value="asc" ${ui.analyticsDir==='asc'?'selected':''}>Lowest first</option></select></label><label class="analytics-check"><input type="checkbox" data-analytics-only ${ui.analyticsOnlyMissed!==false?'checked':''}> Only missed cards</label></div>`}
function deckInsights(d){const m=setMetrics(d),mistakes=recentMistakes(d),learning=learningCards(d).slice().sort((a,b)=>mastery(a)-mastery(b));return `<section class="surface" style="margin-top:19px"><h3>Set statistics</h3><div class="insight-grid"><div><strong>${m.accuracy===null?'—':m.accuracy+'%'}</strong><small>Accuracy</small></div><div><strong>${m.mastered}</strong><small>Mastered</small></div><div><strong>${m.learning}</strong><small>Learning</small></div><div><strong>${m.unseen}</strong><small>Not studied</small></div></div><div class="row wrap" style="margin-top:16px"><button class="btn small" data-act="start" data-mode="learn" data-scope="learning">Study learning</button><button class="btn small" data-act="start" data-mode="mc" data-scope="mistakes">Review recent mistakes</button></div><h3 style="margin-top:23px">Card performance</h3>${analyticsControls()}${detailedWrongRows(d.cards,d.cards.length)}<h3 style="margin-top:24px">Still learning</h3><div class="learning-scroll">${learning.length?learning.slice(0,14).map(c=>`<div class="insight-term"><span>${esc(shortTerms(c.term,32))}</span><span class="pill">${mastery(c)}%</span></div>`).join(''):'<p class="muted small">No cards in progress yet.</p>'}</div><h3 style="margin-top:22px">Last 10 mistakes</h3>${mistakes.length?mistakes.map(x=>`<div class="insight-term"><span>${esc(shortTerms(getCard(x.cardId,d)?.term||x.term,28))}</span><span class="muted small">${esc(x.mode||'study')} · ${fmtDate(x.at)}</span></div>`).join(''):'<p class="muted small">Your mistakes will appear here as you study.</p>'}</section>`}
function logMistake(card){let deckId=ui.session?.deckId||ui.test?.deckId||ui.deckId;data.mistakeLog=Array.isArray(data.mistakeLog)?data.mistakeLog:[];data.mistakeLog.push({deckId,cardId:card.id,term:card.term,at:Date.now(),mode:ui.session?.mode||'test'});if(data.mistakeLog.length>500)data.mistakeLog.splice(0,data.mistakeLog.length-500)}
function updatePractice(card,correct){if(correct){card.correct=(card.correct||0)+1;card.streak=(card.streak||0)+1}else{card.wrong=(card.wrong||0)+1;card.streak=0;logMistake(card)}card.lastReviewed=Date.now();save()}
function startMode(mode,scope='all'){
 clearTimeout(flashRevealTimer);flashRevealTimer=null;
 if(!['flash','learn','mc','blitz','write','test'].includes(mode)){toast('Choose one of the six available study modes.');return}
 clearInterval(timerHandle);timerHandle=null;
 const d=getDeck();if(!d?.cards?.length){toast('Add at least one flashcard first.');return}
 if(mode==='test'){ui.page='test';ui.test={deckId:d.id,count:Math.min(20,d.cards.length),types:['mc','write','tf'],questions:[],submitted:false,result:null,started:Date.now()};render();return}
 let cards=d.cards.slice();
 if(scope==='learning')cards=learningCards(d);
 if(scope==='starred')cards=d.cards.filter(c=>c.starred);
 if(scope==='mistakes'){const ids=[...new Set(recentMistakes(d).map(m=>m.cardId))];cards=ids.map(id=>getCard(id,d)).filter(Boolean)}
 if(!cards.length){toast(scope==='mistakes'?'No mistakes recorded yet.':scope==='starred'?'Star some cards first.':scope==='learning'?'No cards still being learned yet.':'No cards to study.');return}
 if(mode==='blitz'&&d.cards.length<2){toast('Blitz needs at least two terms.');return}
 ui.session={mode,scope,deckId:d.id,ids:shuffle(cards.map(c=>c.id)),pos:0,right:0,wrong:0,attempts:{},start:Date.now(),flip:false,revealedCards:{},feedback:null,phase:'question',q:null,blitzLeft:60,completed:0};ui.page='study';
 if(['learn','mc','write','blitz'].includes(mode))makeQuestion();
 if(mode==='blitz')timerHandle=setInterval(()=>{if(!ui.session||ui.session.mode!=='blitz'){clearInterval(timerHandle);return}ui.session.blitzLeft--;if(ui.session.blitzLeft<=0){finishSession();return}let t=$('#blitz-clock');if(t)t.textContent=ui.session.blitzLeft+'s'},1000);
 render();
}

function modeTitle(m){return ({flash:'Flashcards',learn:'Learn',mc:'MCQ',write:'Write',test:'Practice test',blitz:'Blitz'})[m]||m}
function shuffleSession(){let s=ui.session;if(!s||!['flash','review'].includes(s.mode))return;s.ids=shuffle(s.ids);s.pos=0;s.flip=false;s.revealedCards={};render();toast('Cards reshuffled.')}
function flashView(s,c){
 const flip=s.flip,zh=isChineseCard(c);
 const back=zh?chineseBackHtml(c):`<div class="study-word">${esc(solutionText(c))}</div>`;
 const front=`<div class="study-word ${zh?'hanzi':''}">${esc(zh?c.term:promptText(c))}</div>${zh?pinyinHintHtml(c,'study-secondary'):''}`;
 return `<div class="study-card" data-act="flip" role="button" tabindex="0" aria-label="Flip flashcard"><button class="icon-btn in-card-star ${c.starred?'active':''}" data-act="star" data-id="${c.id}" aria-label="${c.starred?'Unstar':'Star'} this card" title="Star / unstar (F)">${icon('star')}</button><span class="face-label">${flip?'BACK · ANSWER':'FRONT · TERM'}</span>${flip?back:front}${flip&&c.notes?`<div class="muted card-notes">${esc(c.notes)}</div>`:''}${c.image&&!flip?`<img alt="Card illustration" src="${safeImage(c.image)}" style="max-height:140px;border-radius:11px"/>`:''}<button class="icon-btn speak-float" data-act="speak" data-id="${c.id}" title="Play audio manually" aria-label="Play audio manually">${icon('speaker')}</button><div class="flip-note">${s.autoAdvancing?'Showing answer · next card in 1 second':'Tap card to flip <span class="kbd">Space</span>'}</div></div><div class="study-controls"><button class="icon-btn" data-act="prev" ${s.pos===0?'disabled':''} aria-label="Previous card">${icon('back')}</button><button class="btn" data-act="flip">${icon('refresh')} Flip</button><button class="icon-btn" data-act="shuffle-session" aria-label="Shuffle cards">${icon('shuffle')}</button><button class="icon-btn" data-act="next" aria-label="Next card">${icon('arrow')}</button></div><div class="flash-grade" role="group" aria-label="Grade your recall"><button class="btn flash-wrong" data-act="flash-grade" data-value="wrong" ${s.autoAdvancing?'disabled':''} title="Save as wrong and move on">${icon('close')} Wrong</button><button class="btn flash-right" data-act="flash-grade" data-value="right" ${s.autoAdvancing?'disabled':''} title="Mark Right; shows answer for one second only if not already viewed">${icon('check')} Right</button></div>`;
}










/* v4: accessible study controls and Chinese-character handwriting. No remote network calls. */



function quickStudyToolbar(c){const hasChinese=isChineseCard(c);return `<div class="quick-tools" role="toolbar" aria-label="Study accessibility controls"><span class="quick-tools-label">Quick tools</span><button class="quick-tool ${data.settings.largeText?'is-on':''}" data-act="quick-large" title="Toggle larger text" aria-pressed="${!!data.settings.largeText}">Aa<span class="quick-tool-text"> Larger text</span></button>${hasChinese?`<button class="quick-tool ${data.settings.showPinyin?'is-on':''}" data-act="quick-pinyin" title="Show or hide Pinyin hints on Chinese question sides" aria-pressed="${!!data.settings.showPinyin}">拼<span class="quick-tool-text"> Pinyin ${data.settings.showPinyin?'on':'off'}</span></button>`:''}<button class="quick-tool" data-act="speak" data-id="${c?.id||''}" title="Play audio manually (never autoplay)">♫<span class="quick-tool-text"> Play audio</span></button></div>`}







// Each study render replaces its canvas. Observing app changes allows fresh
// canvas pointers without changing the existing app navigation mechanism.



// Keep legacy authored sentence data importable, but do not load an inactive
// lesson engine. The six supported study modes remain unchanged.
function initLabData(){
 if(!data.languageLab||typeof data.languageLab!=="object")data.languageLab={};
 if(!Array.isArray(data.languageLab.custom))data.languageLab.custom=[];
 if(!data.languageLab.skills||typeof data.languageLab.skills!=="object")data.languageLab.skills={};
 return data.languageLab;
}
function isMandarinDeck(deck){return String(deck.lang||"").startsWith("zh")||(deck.cards||[]).some(c=>isChineseCard(c));}

/* v6.3 — Chinese Numbers: deterministic, fully offline Mandarin number conversion. */














// Keyboard events use key and focus gates; never hijack typing in editable controls.
document.addEventListener('keydown',e=>{if(!startupComplete)return;const k=e.key.toLowerCase();if(e.altKey&&(e.code==='KeyP'||k==='p')&&!e.ctrlKey&&!e.metaKey){e.preventDefault();setShowPinyin(!data.settings.showPinyin);return}if(e.key==='Escape'&&ui.modal){closeModal();return}if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable||ui.modal||e.altKey||e.metaKey||e.ctrlKey)return;
 if(e.key==='?'){e.preventDefault();ui.modal='help';renderModal();return}
 let s=ui.session;if(ui.page==='study'&&s){if(s.mode==='flash'&&(k==='x'||k==='c')){e.preventDefault();gradeFlash(k==='c')}else if(k==='f'){e.preventDefault();let c=currentCard();if(c){c.starred=!c.starred;save();render()}}else if(k==='r'&&['flash','review'].includes(s.mode)){e.preventDefault();shuffleSession()}else if(/^[1-4]$/.test(k)&&s.q?.kind==='mc'&&s.phase==='question'){const v=s.q.choices[Number(k)-1];if(v!==undefined){e.preventDefault();answerPractice(v)}}else if(e.key==='Enter'&&s.phase==='feedback'){e.preventDefault();nextQuestion()}}
 
});

// One event delegate keeps controls responsive even when a view is re-rendered.
document.addEventListener('click',async e=>{let target=e.target.closest('[data-act]');if(!target)return;if(!startupComplete)return;const a=target.dataset.act,id=target.dataset.id,m=target.dataset.mode;if(a==='close-modal'&&target.classList.contains('modal-backdrop')&&e.target.closest('[data-no-close]'))return;if(a==='flip'&&e.target.closest('button[data-act="speak"]'))return;
switch(a){case'delete-deck-id':e.preventDefault();e.stopPropagation();removeDeck(id);break;
 case'select-deck':{e.preventDefault();const sel=ui.libraryFilters.selected;ui.libraryFilters.selected=sel.includes(id)?sel.filter(x=>x!==id):[...sel,id];render();break}
 case'toggle-bulk-select':ui.libraryFilters.selectMode=!ui.libraryFilters.selectMode;if(!ui.libraryFilters.selectMode)ui.libraryFilters.selected=[];render();break;
 case'select-filtered-decks':ui.libraryFilters.selected=[...new Set([...ui.libraryFilters.selected,...[...document.querySelectorAll('.cards-grid .deck-card')].map(x=>x.dataset.id)])];render();break;
 case'unselect-decks':ui.libraryFilters.selected=[];render();break;
 case'delete-selected-decks':deleteDecksByIds(ui.libraryFilters.selected);break;
 case'toggle-library-search':ui.libraryFilters.expanded=!ui.libraryFilters.expanded;render();break;
  case'reset-library-filters':ui.filter='all';ui.q='';ui.libraryFilters.subject='all';ui.libraryFilters.status='all';ui.libraryFilters.sort='recent';render();break;
 case'go-back':{const parent=ui.page==='study'||ui.page==='test'?'deck':ui.page==='deck'?'library':'home';nav(parent);break;}case'nav':ui.q='';nav(target.dataset.page);break;case'open-deck':ui.q='';nav('deck',id||ui.deckId);break;case'open-menu':document.body.classList.add('mobile-nav');break;case'close-menu':document.body.classList.remove('mobile-nav');break;case'new-deck':ui.modal='deck';ui.editing='';renderModal();break;case'edit-deck':ui.modal='deck';ui.editing='deck';renderModal();break;case'add-card':ui.modal='card';ui.editing='';pendingFileImage=null;renderModal();break;case'edit-card':ui.modal='card';ui.editing=id;pendingFileImage=null;renderModal();break;case'close-modal':closeModal();break;case'cancel-delete':cancelDelete();break;case'confirm-delete':confirmDelete();break;case'remove-card-image':pendingFileImage='remove';target.closest('.row')?.remove();break;case'star':{let c=getCard(id);if(c){c.starred=!c.starred;save();render()}break;}case'speak':{let c=getCard(id);playSpeech(c?.term,getDeck()?.lang||'en-US');break;}case'delete-card':removeCard(id);break;case'delete-deck':removeDeck();break;case'export-deck':ui.modal='export';renderModal();break;case'backup':backup();break;case'snooze-backup':data.backupSnoozedUntil=Date.now()+86400000;save();render();break;case'download-deck-json':downloadDeck(true);break;case'download-deck-csv':downloadDeck(false);break;case'copy-deck':copyDeck();break;case'folder-filter':ui.filter=target.dataset.folder;render();break;case'show-help':ui.modal='help';renderModal();break;case'shuffle-session':shuffleSession();break;case'quick-pinyin':setShowPinyin(!data.settings.showPinyin);break;case'quick-voice':playSpeech(currentCard()?.term,getDeck()?.lang||'en-US');break;case'quick-large':data.settings.largeText=!data.settings.largeText;save();render();break;case'start':startMode(m,target.dataset.scope||'all');break;case'flip':flipFlash();break;case'next':nextQuestion();break;case'prev':previousFlash();break;case'flash-grade':gradeFlash(target.dataset.value==='right');break;case'answer':answerPractice(target.dataset.value);break;case'restart':startMode(ui.session?.mode||'flash',ui.session?.scope||'all');break;case'create-test':createTest();break;case'reset-test':startMode('test');break;case'import-text':importText($('#import-text')?.value||'',($('#import-title')?.value||'').trim(),($('#import-folder')?.value||'').trim());break;case'paste-demo':{let x=$('#import-text');if(x)x.value='Demand\tWillingness and ability to buy\nSupply\tQuantity offered for sale\nOpportunity cost\tValue of the next best alternative forgone';break;}}
});
document.addEventListener('submit',async e=>{if(!['deck-form','card-form','answer-form','test-form','lab-answer-form','lab-editor','number-form'].includes(e.target.id))return;e.preventDefault();if(!startupComplete)return;let form=e.target,fd=new FormData(form);if(form.id==='deck-form')formDeck(fd);if(form.id==='card-form')await formCard(fd);if(form.id==='answer-form'){const c=currentCard(),dual=ui.session?.q?.kind==='write'&&chineseWriteMode(c);answerPractice(dual?{pinyin:fd.get('pinyin')||'',meaning:fd.get('meaning')||''}:fd.get('answer')||'')}if(form.id==='test-form')submitTest(form)});
function captureAndRerender(){const active=document.activeElement,oldForms=[...document.querySelectorAll('form')].map(form=>({id:form.id,fields:[...form.querySelectorAll('input,textarea,select')].map(el=>({name:el.name,id:el.id,type:el.type,value:el.value,checked:el.checked}))}));render();for(const f of oldForms){const form=document.getElementById(f.id);if(!form)continue;for(const item of f.fields){const candidates=[...form.querySelectorAll('input,textarea,select')];const el=candidates.find(el=>item.name&&el.name===item.name&&(!['checkbox','radio'].includes(item.type)||el.value===item.value))||candidates.find(el=>item.id&&el.id===item.id);if(!el)continue;if(item.type==='checkbox'||item.type==='radio')el.checked=item.checked;else el.value=item.value}}}
document.addEventListener('change',e=>{if(!startupComplete)return;const el=e.target;if(el.hasAttribute('data-analytics-sort')){ui.analyticsSort=el.value;render();return;}if(el.hasAttribute('data-analytics-dir')){ui.analyticsDir=el.value;render();return;}if(el.hasAttribute('data-analytics-only')){ui.analyticsOnlyMissed=el.checked;render();return;}if(el.dataset.writePart){const container=el.closest('.write-preferences');const p=container?.querySelector('[data-write-part="pinyin"]')?.checked;const m=container?.querySelector('[data-write-part="meaning"]')?.checked;data.settings.writeParts=p&&m?'both':p?'pinyin':m?'meaning':'random';save();captureAndRerender();return;}if(el.dataset.studySetting){data.settings[el.dataset.studySetting]=el.value;save();captureAndRerender();return;}if(el.dataset.libraryFilter){const k=el.dataset.libraryFilter;if(['subject','status','sort'].includes(k)){ui.libraryFilters[k]=el.value;render()}return;}if(el.id==='import-file'&&el.files?.[0])importFile(el.files[0]);if(el.dataset.setting){let k=el.dataset.setting;if(k==='showPinyin'){setShowPinyin(el.checked);return;}data.settings[k]=el.type==='checkbox'?el.checked:el.value;save();if(['theme','showPronunciation','backupReminderDays','largeText','mcqDisplay','writeParts'].includes(k))render();}if(el.dataset.learnType){let k=el.dataset.learnType,types=data.settings.learnTypes;if(el.checked&&!types.includes(k))types.push(k);else if(!el.checked){if(types.length===1){el.checked=true;toast('Keep at least one question type selected.');return}data.settings.learnTypes=types.filter(x=>x!==k)}save();}});
document.addEventListener('input',e=>{
 const el=e.target,role=el.dataset.role;
 if(!['term-search','library-search'].includes(role))return;
 ui.q=el.value;
 if(e.isComposing)return;
 const caret=el.selectionStart;
 clearTimeout(searchRenderTimer);
 searchRenderTimer=setTimeout(()=>{
  searchRenderTimer=null;
  render();
  const replacement=document.querySelector(`[data-role="${role}"]`);
  if(replacement){replacement.focus();try{replacement.setSelectionRange(caret,caret)}catch(e){}}
 },110);
});
// Enter/Space work on keyboard-focusable deck cards.
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.deck-card')){e.preventDefault();if(e.target.dataset.act==='select-deck'){const id=e.target.dataset.id,sel=ui.libraryFilters.selected;ui.libraryFilters.selected=sel.includes(id)?sel.filter(x=>x!==id):[...sel,id];render()}else{ui.q='';nav('deck',e.target.dataset.id)}}});
if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}))}
document.querySelector('#app').innerHTML='<div class="loading-app">Loading your saved study sets…</div>';
hydrateData();
