


const peter =
`<?xml version="1.0" encoding="UTF-8"?>
<俄语 լեզու="ռուսերեն">данные</俄语>`;


const carl =
`<?xml version="1.0" encoding="UTF-8"?>
<breakfast_menu>
<food>
    <name>Belgian <span>Hot Blonde</span> Waffles</name>
    <price>$5.95</price>
    <description>
   Two of our famous Belgian Waffles with plenty of real maple syrup
   </description>
    <calories>650</calories>
</food>
<food>
    <name>Strawberry Belgian Waffles</name>
    <price>$7.95</price>
    <description>
    Light Belgian waffles covered with strawberries and whipped cream
    </description>
    <calories>900</calories>
</food>
<food>
    <name>Berry-Berry Belgian Waffles</name>
    <price />
    <description>Belgian waffles covered with assorted fresh berries and whipped cream</description>
    <calories>900</calories>
</food>
<food>
    <name>French Toast</name>
    <price></price>
    <description>
    Thick slices made from our homemade sourdough bread
    </description>
    <calories>600</calories>
</food>
<food>
    <name>Homestyle Breakfast</name>
    <price>$6.95</price>
    <description>
    Two eggs, bacon or sausage, toast, and our ever-popular hash browns
    </description>
    <calories>950</calories>
</food>
</breakfast_menu>`;


const Char_MarkupStartBracket = '<';
const Char_MarkupStartAmpersand = '&';

const Char_MarkupCloseTagPrefixSuffix = '/';

const Char_MarkupStopBracket = '>';
const Char_MarkupStopSemicolon = ';';



function parseTits(xmlString: string) {
	do {
		const specialTagSauceEnd = xmlString.indexOf('?>');
		if (specialTagSauceEnd > -1) xmlString = xmlString.substring(specialTagSauceEnd + '?>'.length);
		else break;
	} while (true);

    const chars = [...xmlString];
	return parseElement(chars);
}


class TagCompleted extends Error {

	constructor(public readonly tag: any) {
		super();
	}
}


interface Elem {
	tagName: string,
	attributes: { [key: string]: string };
	children: (Elem | string)[];
}

interface State {
	isTagOpened: boolean,
	isTagNameDone: boolean,
	willTagComplete: boolean,
	isContent: boolean,
	detectAttributes: boolean,
	insideAttributeValue: boolean,
	isEntityStarted: boolean,
	isInsideCDATA: boolean,
}




function unescapeXmlEntity(entity: string): string {
	if (entity === 'lt') {
		return '<'		
	} else if (entity === 'gt') {
		return '>'
	} else if (entity === 'amp') {
		return '&'
	} else if (entity === 'apos') {
		return "'"
	} else if (entity === 'quot') {
		return '"'
	} else if (entity.startsWith('#x')) {
		const hex = parseInt(entity.substr('#x'.length), 16);
		if (!hex) throw 'invalid';
		return String.fromCodePoint(hex);
	} else if (entity.startsWith('#')) {
		const dec = parseInt(entity.substr('#'.length), 10);
		if (!dec) throw 'invalid';
		return String.fromCodePoint(dec);
	} else return '( *  )(  * )';
}

const joinStringChildren = true;

function parseElement(chars :string[]) {

	const isWhitespace = (ch :string) => ch.trim() === '';

	let charBuffer :string[] = [];

	const RESET_STATE = {
		isTagOpened: false,
		isTagNameDone: false,
		willTagComplete: false,
		isContent: false,
		detectAttributes: false,
		insideAttributeValue: false,
		isEntityStarted: false,
		isInsideCDATA: false,
	};

	let currentAttrKey = '';

	let STATE = Object.assign({}, RESET_STATE);

	const RETURN_ELEM = {
		tagName: "",
		attributes: {} as { [key :string] :string },
		children: [] as (Elem | string)[],
	}

	let potentialTextNutte = '';

	let charBufDuringEntity: string[] = [];


	const recState: { elem: Elem, state: State }[] = [];
	
	let closingRectBracketsFound = 0;

	const _DEBUG_EVERY_CHAR = false;

	try {
		chars.forEach((char, index) => {
			if (_DEBUG_EVERY_CHAR) console.log("\nCURRENT CHAR: " + index + ' curChar: "' + char + '"\nSTAEE: ' + JSON.stringify(STATE) + '  RETEL: ' + JSON.stringify(RETURN_ELEM) + (recState.length > 0 ? '   CUR_PARENT: ' + recState[recState.length - 1].elem.tagName : ''));

			// if (index >= 162) debugger;

			if (STATE.isInsideCDATA) {
				if (char === ']')
					++closingRectBracketsFound;
				else if (char === '>' && closingRectBracketsFound >= 2) {
					let str = charBuffer.join('');
					charBuffer.splice(0);
					const countRecBracketsCDATAstop = 2;
					str = str.substring(0, str.length - countRecBracketsCDATAstop);
					console.warn('FOUND SHIT: ' + str)

					if (recState.length > 0) {
						const parentChilds = recState[recState.length - 1].elem.children;
						if (joinStringChildren && typeof parentChilds[parentChilds.length - 1] === 'string') {
							parentChilds[parentChilds.length - 1] += str;
						} else
							parentChilds.push(str);
					} else throw ('TOP CDATA');

					closingRectBracketsFound = 0;
					STATE.isInsideCDATA = false;
					return;
				} else
					closingRectBracketsFound = 0;

				charBuffer.push(char);
				return;
			}


			if (STATE.isEntityStarted && char !== Char_MarkupStopSemicolon) {
				// console.log('now ' + char);
				charBuffer.push(char);
				return;
			}

			

				switch (char) {


					case Char_MarkupStartBracket:
						if (!STATE.isTagOpened) {
							const textNutte = charBuffer.join('');
							charBuffer.splice(0);

							if (textNutte && recState.length > 0) {
								const parentChilds = recState[recState.length - 1].elem.children;
								if (joinStringChildren && typeof parentChilds[parentChilds.length - 1] === 'string') {
									parentChilds[parentChilds.length - 1] += textNutte;
								} else
									parentChilds.push(textNutte);
							}
							STATE.isTagOpened = true;
							return;
						}
						throw 'peter';
			
					case Char_MarkupStartAmpersand:

						if (!STATE.isEntityStarted) {
							charBufDuringEntity = [...charBuffer];
							charBuffer.splice(0);

							STATE.isEntityStarted = true;
							return;
						}
						throw 'peter';
					
					case Char_MarkupStopSemicolon:
						if (STATE.isEntityStarted) {
							const entity = charBuffer.join('');
							charBuffer.splice(0);

							const strin = unescapeXmlEntity(entity);

							charBuffer = [...charBufDuringEntity].concat([...strin]);
							charBufDuringEntity = [];
							
							STATE.isEntityStarted = false;
							return;
						}

					case '[':
						if (charBuffer.length === '![CDATA'.length && charBuffer.join('') === '![CDATA') {
							if (recState.length > 0) {
								STATE.isInsideCDATA = true;
								charBuffer.splice(0);
								STATE.isTagOpened = false; // the open tag found belonged to '<!CDATA['
								return;
							}
							throw 'Found TOP-LEVEL CDATA sec!!'
						}
						// console.warn('cbuf: ', charBuffer.join(''));
						break;

						/*
						`<food>
							<name type="doofus" lecker="false">Berry-Berry Belgian Waffles</name>
							<price  type="doofus" />
							<description>
							Belgian waffles covered with assorted fresh berries and whipped cream
							</description>
							<calories>900</calories>
						</food>
						<food>
							<name>French Toast</name>
							<price></price>
							<description>
							Thick slices made from our homemade sourdough bread
							</description>
							<calories>600</calories>
						</food>`
						*/

						`{
	tagName: "food",
	attributes: {
		something: "pter",
	},
	children: [
		{ tagName: "name", ..., children: [ "Berry-Berry" ] }, {},
	],
}`
					case Char_MarkupStopBracket:
						if (STATE.isTagOpened) {

							if (STATE.willTagComplete) {
								if (!STATE.isTagNameDone) {
									if (charBuffer.length < 1)
										throw 'peter';
									const tagName = charBuffer.join('').trim();
									charBuffer.splice(0);

									if (recState.length > 0 && recState[recState.length - 1].elem.tagName === tagName) {
										const parentNode = recState.pop();
										if (potentialTextNutte) {
											if (typeof parentNode!.elem.children[parentNode!.elem.children.length - 1] === 'string') throw 'HERE BE DRAGONS'
											parentNode!.elem.children.push(potentialTextNutte);
										}
										STATE = parentNode!.state;
										RETURN_ELEM.tagName = parentNode!.elem.tagName;
										RETURN_ELEM.attributes = parentNode!.elem.attributes;
										RETURN_ELEM.children = parentNode!.elem.children;
									}
							
									if (RETURN_ELEM.tagName !== tagName)
										throw 'invalid markup wrong tags'
								}

								if (recState.length > 0) {
									recState[recState.length - 1].elem.children.push(Object.assign({}, RETURN_ELEM));
									RETURN_ELEM.tagName = '';
									RETURN_ELEM.attributes = {};
									RETURN_ELEM.children = [];
									STATE = Object.assign({}, RESET_STATE);
									return;
								} else
									throw new TagCompleted(RETURN_ELEM);
							} else {
								const p = 1;


							}

							// necessary?? - YES! <dcm>
							if (!STATE.isTagNameDone) {
								if (charBuffer.length < 1)
									throw 'peter';
								RETURN_ELEM.tagName = charBuffer.join('');
								charBuffer.splice(0);

							}
					
							if (!STATE.willTagComplete) {
								const kk = 1;

								STATE.isTagOpened = false;
								STATE.isTagNameDone = false;

								recState.push({
									state: Object.assign({}, STATE),
									elem: Object.assign({}, RETURN_ELEM),
								});
								STATE = Object.assign({}, RESET_STATE);
								RETURN_ELEM.tagName = "";
								RETURN_ELEM.attributes = {};
								RETURN_ELEM.children = [];
								// collect CHILDREN
								// recursive!!
								return;
							}


							STATE.isTagOpened = false;
							STATE.isTagNameDone = false;
							return;
						}
						throw 'peter';
					/*
					<breakfast_menu>
					<food>
						<name>Belgian Waffles</name>
						<price>$5.95</price>
						<description>
					   Two of our famous Belgian Waffles with plenty of real maple syrup
					   </description>
						<calories>650</calories>
						<favorites/>
					</food>
					...
					*/

					case Char_MarkupCloseTagPrefixSuffix:
						if (STATE.isTagOpened && !STATE.insideAttributeValue) {
							if (!STATE.willTagComplete) {
								if (!STATE.isTagNameDone) {
									const tagName = charBuffer.join('');
									charBuffer.splice(0);

									if (tagName) {
										RETURN_ELEM.tagName = tagName;
										STATE.isTagNameDone = true;
									}
								}
						
								STATE.willTagComplete = true;
								return;
							}
						}
						// continue -> is valid as text too
				}


				`  <name type="doofus" tasty="false">Berry-Berry Belgian Waffles</name>
    <price  type="doofus" />`


					/* default: */
		if( isWhitespace(char) ) {
			if( STATE.isTagOpened )	{
				if(!STATE.isTagNameDone && !STATE.willTagComplete) {
					const tagName = charBuffer.join('');
					charBuffer.splice(0);
					if (tagName) {
						RETURN_ELEM.tagName = tagName;
						STATE.isTagNameDone = true;
						STATE.detectAttributes = true;
					}
					return;
				} else { // isTagNameComplete
					if( STATE.detectAttributes && !STATE.insideAttributeValue ) {
						return;
					}
				}
				if( !STATE.willTagComplete && !STATE.insideAttributeValue )
					throw 'peter'
			}
		}

		if( STATE.detectAttributes ) {
			if( char === '=' && !STATE.insideAttributeValue) {
				if (currentAttrKey) {
					const p = chars.slice(index - 100, index + 100).join('');
					console.log(p);
					throw 'alredyattr';
				}

				currentAttrKey = charBuffer.join('');
				charBuffer.splice(0);
				return;
			} else if ( char === '"' ) {
				if( !STATE.insideAttributeValue ) {
					charBuffer.splice(0);
					STATE.insideAttributeValue = true;
					return;
				} else {
					const ppcurrentAttrVal = charBuffer.join('');
					charBuffer.splice(0);
					RETURN_ELEM.attributes[currentAttrKey] = ppcurrentAttrVal;
					currentAttrKey = '';
					STATE.insideAttributeValue = false;
					return;
				}
			}
		}

		charBuffer.push(char);
    });
} catch(ex) {
	// console.warn('except;: ', ex);
	if( ex instanceof TagCompleted ) {
		console.log(/*'Tag complete: ',*/ JSON.stringify(ex.tag, null, '\t'));
	}
	else throw ex;
}
}


// console.log('Hello Tits!');

// console.log( parseTits(carl) );

const fsx = require('fs');

// // // const json_responce = JSON.parse(fsx.readFileSync('C:\\Users\\Sgt. Nukem\\Documents\\article_checkout_response.json', 'utf8'));

// // // const sanitzedSHIIIIT_jsonML = JSON.parse( json_responce.article_str )

// // // function jsML2xml(some: any) {
// // // 	if (!Array.isArray(some)) throw 'STUPID'

// // // 	if (typeof some[0] !== 'string') throw 'ASS'
	
// // // 	let hasAttr = some.length > 1 && typeof some[1] === 'object' && !Array.isArray(some[1]);

// // // 	let hasChilds = (some.length > 1 && Array.isArray(some[1])) || some.length > 2;

// // // 	const collectAttr = (obj: { [key: string]: string }) => {
// // // 		let pittr = ''
// // // 		for (let [k, v] of Object.entries(obj)) {
// // // 			pittr += ' ' + k + '="' + v + '"';
// // // 			// console.log(k + '  -->  ' + v);
// // // 		}
		
// // // 		return pittr;
// // // 	}

// // // 	let retunre = '<' + some[0] + (hasAttr ? collectAttr(some[1]) : '') + (hasChilds ? '>' : ' />');
	
// // // 	if (hasChilds) {
// // // 		const StartOffs = Array.isArray(some[1]) ? 1 : 2;
// // // 		for (let i = StartOffs; i < some.length; i++) {
// // // 			if (typeof some[i] === 'string') retunre += some[i];
// // // 			else retunre += jsML2xml(some[i]);
// // // 		}
// // // 		retunre += '</' + some[0] + '>'
// // // 	}

// // // 	return retunre;
// // // }


// // // let xmlSTR = jsML2xml(sanitzedSHIIIIT_jsonML);
// // // fsx.writeFileSync('.\\converted_article.xml', xmlSTR);



const filename = process.argv[2];
// const filename = '.\\converted_article.xml';
// const filename = `C:\\Users\\Sgt. Nukem\\Documents\\Word_XML_Example.xml`;

const mark_art = fsx.readFileSync(filename, 'utf8');
parseTits(mark_art);



// console.log( parseTits(peter) );

//const boobs = '   <   boobs   size  =  " gigantic "  buxom =    " very ! ! " />';
// const boobs = '   <  boobs  size  =  " gigantic "    buxom =    " very ! ! "   >< item  attr="true" /><tx><![CDATA[<sender>John Smith</sender>]]><![CDATA[>TITMASTER&CONTROLLER<]]>&lt;sender&gt;John Smith&lt;/sender&gt;</tx><geil  >hack a peter<peter2>&lt;GRAY&apos;</peter2>hack&#9731;ack</ geil ><beshine><![CDATA[]]]]><![CDATA[>]]></beshine><  /    boobs  >    ';
// console.log('parsing: ' + boobs);
// parseElement([...boobs]);

// const dumbplace = `<dcm><metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:opf="http://www.idpf.org/2007/opf" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:identifier id="dcidid">idD375AA0071464FBC8B6D1442AA4C12CB</dc:identifier><dc:language /><dc:contributor /></metadata></dcm>`;
// parseElement([...dumbplace]);