const TokenTypes = {
    LeftParenthesis: 'LeftParenthesis',
    RightParenthesis: 'RightParenthesis',
    CurlyBraces: 'CurlyBraces',
    AngleBrackets: 'AngleBrackets',
    AssignmentOperator: 'AssignmentOperator',
    BinaryOperator: 'BinaryOperator',
    Func: 'Func',
    Keyword: 'Keyword',
    Num: 'Num',
    String: 'String',
    Comma: 'Comma',
    Comm : "Comm"
};

function tokenize(text) {
    let cleanText = text.trim();
    let tokensArray = [];
    let i = 0;

    while (i < cleanText.length) {
        let char = cleanText[i];

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (char === '"') {
            let strValue = "";
            i++; 
            while (i < cleanText.length && cleanText[i] !== '"') {
                strValue += cleanText[i];
                i++;
            }
            tokensArray.push({
                type: TokenTypes.String,
                value: strValue
            });
            i++; 
            continue;
        }

        if (char === "/" && cleanText[i + 1] === "/") {
            let commentValue = "";
            while (i < cleanText.length && cleanText[i] !== "\n") {
                commentValue += cleanText[i];
                i++;
            }
            tokensArray.push({
                type: TokenTypes.Comm,
                value: commentValue
            });
            continue;
        }

        if (/[0-9]/.test(char)) {
            let numStr = "";
            while (i < cleanText.length && /[0-9.]/.test(cleanText[i])) {
                numStr += cleanText[i];
                i++;
            }
            tokensArray.push({
                type: TokenTypes.Num,
                value: Number(numStr)
            });
            continue;
        }

        if (char === "(") {
            tokensArray.push({
                type: TokenTypes.LeftParenthesis,
                value: "("
            });
            i++;
            continue;
        }
        if (char === ")") {
            tokensArray.push({
                type: TokenTypes.RightParenthesis,
                value: ")"
            });
            i++;
            continue;
        }
        if (char === "{" || char === "}") {
            tokensArray.push({
                type: TokenTypes.CurlyBraces,
                value: char,
            });
            i++;
            continue;
        }
        if (char === "<" || char === ">") {
            tokensArray.push({
                type: TokenTypes.AngleBrackets,
                value: char,
            });
            i++;
            continue;
        }
        if (char === ",") {
            tokensArray.push({
                type: TokenTypes.Comma,
                value: ","
            });
            i++;
            continue;
        }

        if ((char === '+' || char === "-" || char === "/" || char === "*") && cleanText[i + 1] === "=") {
            tokensArray.push({
                type: TokenTypes.AssignmentOperator,
                value: char + "="
            });
            i += 2;
            continue;
        }

        if (char === '+' || char === "-" || char === "/" || char === "*" || char === "=" || char === "!") {
            tokensArray.push({
                type: TokenTypes.BinaryOperator,
                value: char
            });
            i++;
            continue;
        }

        let remainingText = cleanText.slice(i);
        let multiWordKeyword = null;

        if (remainingText.startsWith('define-method')) multiWordKeyword = 'define-method';
        else if (remainingText.startsWith('again if')) multiWordKeyword = 'again if';
        else if (remainingText.startsWith('to be')) multiWordKeyword = 'to be';

        if (multiWordKeyword) {
            let nextChar = cleanText[i + multiWordKeyword.length];
            if (!nextChar || !/[a-zA-Z0-9._-]/.test(nextChar)) {
                tokensArray.push({
                    type: TokenTypes.Keyword,
                    value: multiWordKeyword
                });
                i += multiWordKeyword.length;
                continue;
            }
        }

        let wordStr = "";
        let checkIdx = i;
        while (checkIdx < cleanText.length && /[a-zA-Z0-9._-]/.test(cleanText[checkIdx])) {
            wordStr += cleanText[checkIdx];
            checkIdx++;
        }

        if (wordStr !== "") {
            if (['while', 'if', 'let', 'announce', 'else'].includes(wordStr)) {
                tokensArray.push({
                    type: TokenTypes.Keyword,
                    value: wordStr
                });
                i += wordStr.length;
                continue;
            }

            if (['console.print','json.save' , 'random' , 'json.load',  'AI.getAnswer', 'console.input', 'web.write', 'getID', 'web.color', 'send', 'binary', 'number', 'string', 'lengthOf', 'web.hide', 'web.show', 'web.create'].includes(wordStr)) {
                tokensArray.push({
                    type: TokenTypes.Func,
                    value: wordStr
                });
                i += wordStr.length;
                continue;
            }

            tokensArray.push({
                type: TokenTypes.Keyword, 
                value: wordStr
            });
            i += wordStr.length;
            continue;
        }

        i++;
    }

    return tokensArray; 
}

   


//PARSER
function parse(tokens) {
    let current = 0;

    function walk() {
        let token = tokens[current];

        if (!token) {
            return null;
        }

        if (token.type === TokenTypes.Num) {
            current++;
            let node = {
                type: 'NumericLiteral',
                value: token.value
            };
            while (tokens[current] && tokens[current].type === TokenTypes.BinaryOperator && tokens[current].value !== '=') {
                let op = tokens[current].value;
                current++;
                let right = walk();
                if (!right) break;

                node = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: node,
                    right: right
                };
            }
            return node;
        }

        if (token.type === TokenTypes.String) {
            current++;
            return {
                type: 'StringLiteral',
                value: token.value
            };
        }

        if (token.type == TokenTypes.Comm) {
            current++;
            return {
                type: 'Comment',
                value: token.value
            };
        }

        if (token.type === TokenTypes.Keyword) {
            let value = token.value;
            current++;

            if (value === 'define-method') {
                let node = {
                    type: 'FunctionDeclaration',
                    name: '',
                    body: []
                };

                if (tokens[current]) {
                    node.name = tokens[current].value;
                    current++;
                }

                if (tokens[current] && tokens[current].type === TokenTypes.LeftParenthesis) {
                    current++;
                }
                if (tokens[current] && tokens[current].type === TokenTypes.RightParenthesis) {
                    current++;
                }

                if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '{') {
                    current++;
                    while (current < tokens.length && !(tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}')) {
                        let child = walk();
                        if (child) node.body.push(child);
                    }
                    if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}') {
                        current++;
                    }
                }
                return node;
            }

            if (value === 'if' || value === 'while' || value === 'again if') {
                let node = {
                    type: value === 'while' ? 'WhileStatement' : 'IfStatement',
                    conditionText: '',
                    body: [],
                    alternate: null
                };

                let condParts = [];
                while (current < tokens.length && !(tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '{')) {
                    let currentToken = tokens[current];
                    if (currentToken.type === TokenTypes.String) {
                        condParts.push(`"${currentToken.value}"`);
                    } else {
                        condParts.push(currentToken.value);
                    }
                    current++;
                }

                node.conditionText = condParts.reduce((acc, part) => {
                    if (acc === '') return part;
                    if (['=', '<', '>', '!'].includes(part) && ['=', '<', '>', '!'].includes(acc.slice(-1))) {
                        return acc + part;
                    }
                    return acc + ' ' + part;
                }, '');

                if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '{') {
                    current++;
                    while (current < tokens.length && !(tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}')) {
                        let child = walk();
                        if (child) node.body.push(child);
                    }
                    if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}') {
                        current++;
                    }
                }

                if (value === 'if' || value === 'again if') {
                    let nextToken = tokens[current];
                    if (nextToken && nextToken.type === TokenTypes.Keyword && nextToken.value === 'again if') {
                        node.alternate = walk();
                    } else if (nextToken && nextToken.type === TokenTypes.Keyword && nextToken.value === 'else') {
                        current++;
                        let elseNode = {
                            type: 'ElseStatement',
                            body: []
                        };
                        if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '{') {
                            current++;
                            while (current < tokens.length && !(tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}')) {
                                let child = walk();
                                if (child) elseNode.body.push(child);
                            }
                            if (tokens[current] && tokens[current].type === TokenTypes.CurlyBraces && tokens[current].value === '}') {
                                current++;
                            }
                        }
                        node.alternate = elseNode;
                    }
                }

                return node;
            }

            if (value === 'let' || value === 'announce') {
                let node = {
                    type: 'VariableDeclaration',
                    name: '',
                    value: null
                };

                if (tokens[current]) {
                    node.name = tokens[current].value;
                    current++;
                }

                if (value === 'let') {
                    if (tokens[current] && tokens[current].type === TokenTypes.BinaryOperator && tokens[current].value === '=') {
                        current++;
                        node.value = walk();
                    }
                } else if (value === 'announce') {
                    if (tokens[current] && tokens[current].type === TokenTypes.Keyword && tokens[current].value === 'to be') {
                        current++;
                        node.value = walk();
                    }
                }
                return node;
            }

            if (tokens[current] && tokens[current].type === TokenTypes.LeftParenthesis) {
                let node = {
                    type: 'CallExpression',
                    name: value,
                    arguments: []
                };
                return node;
            }
        }

        if (token.type === TokenTypes.Identifier) {
            let nextToken = tokens[current + 1];

            if (nextToken && nextToken.type === TokenTypes.BinaryOperator && nextToken.value === '=') {
                let node = {
                    type: 'AssignmentExpression',
                    name: token.value,
                    value: null
                };
                current += 2;
                node.value = walk();
                return node;
            }

            current++;
            return {
                type: 'Identifier',
                name: token.value
            };
        }

        if (token.type === TokenTypes.Func) {
            let node = {
                type: 'CallExpression',
                name: token.value,
                arguments: []
            };

            current++;
            if (tokens[current] && tokens[current].type === TokenTypes.LeftParenthesis) {
                current++;
            }

            while (current < tokens.length && tokens[current].type !== TokenTypes.RightParenthesis) {
                let beforeIndex = current;
                let argNode = walk();
                if (argNode) {
                    node.arguments.push(argNode);
                }

                if (tokens[current] && tokens[current].type === TokenTypes.Comma) {
                    current++;
                }
                
                if (current === beforeIndex) {
                    current++;
                }
            }

            if (tokens[current] && tokens[current].type === TokenTypes.RightParenthesis) {
                current++;
            }

            while (tokens[current] && tokens[current].type === TokenTypes.BinaryOperator && tokens[current].value !== '=') {
                let op = tokens[current].value;
                current++;
                
                let right = walk();
                if (!right) break;

                node = {
                    type: 'BinaryExpression',
                    operator: op,
                    left: node,
                    right: right
                };
            }

            return node;
        }

        if (token.type === TokenTypes.LeftParenthesis || token.type === TokenTypes.RightParenthesis || token.type === TokenTypes.CurlyBraces || token.type === TokenTypes.Comma) {
            current++;
            return null;
        }

        if (token.type === TokenTypes.BinaryOperator || token.type === TokenTypes.AssignmentOperator) {
            current++;
            return {
                type: 'Operator',
                value: token.value
            };
        }

        throw new TypeError("Unknown token type: " + token.type);
    }

    let ast = {
        type: 'Program',
        body: []
    };

    while (current < tokens.length) {
        let beforeLoopIndex = current;
        let node = walk();
        if (node) {
            ast.body.push(node);
        }

        if (current === beforeLoopIndex) {
            current++;
        }
    }

    return ast; 
}





//TRANSLATING TO JAVASCRIPT
function codeGen(node) {
    if (!node) return '';

    if (node.type === 'Program') {
        return node.body.map(codeGen).filter(Boolean).join('\n');
    }

    if (node.type === 'FunctionDeclaration') {
        const body = node.body.map(codeGen).filter(Boolean).join('\n');
        return `async function ${node.name}() {\n${body}\n}`;
    }

    if (node.type === 'Comment') {
        return `// ${node.value}`;
    }

    if (node.type === 'CallExpression') {
        if (node.name === 'AI.getAnswer') {
            const prompt = node.arguments && node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `await fetch("http://localhost:3000/api/ai?prompt=" + encodeURIComponent(${prompt})).then(res => res.text())`;
        }

        if (node.name === 'web.write') {
            const id = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            const text = node.arguments[1] ? codeGen(node.arguments[1]) : '""';
            return `document.getElementById(${id}).innerText = ${text};`;
        }
        if (node.name === 'web.color') {
            const id = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            const color = node.arguments[1] ? codeGen(node.arguments[1]) : '""';
            return `document.getElementById(${id}).style.color = ${color};`;
        }
        if (node.name === 'send') {
            const target = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `alert(${target});`;
        }
        if (node.name === 'web.hide') {
            const targetId = node.arguments[0] ? codeGen(node.arguments[0]) : '""'; 
            return `document.getElementById(${targetId}).style.display = "none";`;
        }
        if (node.name === 'web.show') {
            const targetId = node.arguments[0] ? codeGen(node.arguments[0]) : '""'; 
            return `document.getElementById(${targetId}).style.display = "block";`;
        }
        if (node.name === 'web.create') {
            const tagName = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            const parentId = node.arguments[1] ? codeGen(node.arguments[1]) : '""';
            return `(() => { let _el = document.createElement(${tagName}); document.getElementById(${parentId}).appendChild(_el); })();`;
        }
        if (node.name === 'getID') {
            const id = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `document.getElementById(${id})`;
        }
        if (node.name === 'console.print') {
            const val = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `console.log(${val});`;
        }
        if (node.name === 'console.input') {
            const msg = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `prompt(${msg})`;
        }
        if (node.name === 'lengthOf') {
            const msg = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `(${msg}).length`;
        }
        if (node.name === 'binary') {
            const val = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `Boolean(${val})`;
        }
        if (node.name === 'number') {
            const val = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `Number(${val})`;
        }
        if (node.name === 'string') {
            const val = node.arguments[0] ? codeGen(node.arguments[0]) : '""';
            return `String(${val})`;
        }
        if (node.name === 'json.save') {
            const fileName = node.arguments[0] ? codeGen(node.arguments[0]) : '"data.json"';
            const dataObj = node.arguments[1] ? codeGen(node.arguments[1]) : '{}';
            return `localStorage.setItem(${fileName}, JSON.stringify(${dataObj}));`;
        }
        if (node.name === 'json.load') {
            const fileName = node.arguments[0] ? codeGen(node.arguments[0]) : '"data.json"';
            return `JSON.parse(localStorage.getItem(${fileName}) || '{}')`;
        }
        if (node.name === 'random') {
            const max = node.arguments[0] ? codeGen(node.arguments[0]) : '10';
            return `Math.floor(Math.random() * ${max}) + 1`;
        }

        const argsCode = node.arguments ? node.arguments.map(codeGen).join(', ') : '';
        return `${node.name}(${argsCode});`;
    }

    if (node.type === 'BinaryExpression') {
        return `(${codeGen(node.left)} ${node.operator} ${codeGen(node.right)})`;
    }

    if (node.type === 'VariableDeclaration') {
        const valCode = node.value ? codeGen(node.value) : '""';
        return `let ${node.name} = ${valCode};`;
    }
    if (node.type === 'AssignmentExpression') {
        const valCode = node.value ? codeGen(node.value) : '""';
        return `${node.name} = ${valCode};`;
    }
    if (node.type === 'IfStatement') {
        const body = node.body.map(codeGen).filter(Boolean).join('\n');
        let result = `if (${node.conditionText}) {\n${body}\n}`;
        
        let currentAlt = node.alternate;
        while (currentAlt) {
            if (currentAlt.type === 'IfStatement') {
                const altBody = currentAlt.body.map(codeGen).filter(Boolean).join('\n');
                result += ` else if (${currentAlt.conditionText}) {\n${altBody}\n}`;
                currentAlt = currentAlt.alternate;
            } else if (currentAlt.type === 'ElseStatement') {
                const elseBody = currentAlt.body.map(codeGen).filter(Boolean).join('\n');
                result += ` else {\n${elseBody}\n}`;
                currentAlt = null;
            } else {
                currentAlt = null;
            }
        }
        return result;
    }
    
        if (node.name === 'json.save') {
        const fileName = node.arguments[0] ? codeGen(node.arguments[0]) : '"data.json"';
        const dataObj = node.arguments[1] ? codeGen(node.arguments[1]) : '{}';
        return `localStorage.setItem(${fileName}, JSON.stringify(${dataObj}));`;
    }
    if (node.name === 'json.load') {
        const fileName = node.arguments[0] ? codeGen(node.arguments[0]) : '"data.json"';
        return `JSON.parse(localStorage.getItem(${fileName}) || '{}')`;
    }
    if (node.type === 'WhileStatement') {
        const body = node.body.map(codeGen).filter(Boolean).join('\n');
        return `while (${node.conditionText}) {\n${body}\n}`;
    }

    if (node.type === 'Identifier') {
        return node.name;
    }

    if (node.type === 'StringLiteral') {
        return `"${node.value}"`;
    }

    if (node.type === 'NumericLiteral') {
        return node.value;
    }

    return '';
}

// SETUP: Browser automation layer
function runZozInBrowser() {
    const scripts = document.querySelectorAll('zoz-script');
    scripts.forEach(scriptNode => {
        const sourceCode = scriptNode.textContent;
        try {
            const tokens = tokenize(sourceCode);
            const ast = parse(tokens);
            const generatedJS = codeGen(ast);
            
            if (generatedJS.includes('await')) {
                const runBlock = new Function(`return (async () => {\n${generatedJS}\n})();`);
                runBlock();
            } else {
                const runBlock = new Function(generatedJS);
                runBlock();
            }
        } catch (err) {
            console.error("[zozScript Browser Error]:", err.message);
        }
    });
}

window.addEventListener('DOMContentLoaded', runZozInBrowser);
