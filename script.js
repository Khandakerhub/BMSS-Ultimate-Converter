// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);

function updatePrismTheme(theme) {
    const prismLink = document.querySelector('#prism-theme');
    if (theme === 'dark') {
        prismLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css';
    } else {
        prismLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.min.css';
    }
}

// Initialize Prism theme
updatePrismTheme(savedTheme);

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Prism after DOM load
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    } else {
        console.error('Prism.js not loaded!');
    }
});

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Update theme and storage
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update Prism theme
    updatePrismTheme(newTheme);

    // Re-highlight code blocks after theme change
    setTimeout(() => {
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    }, 100);
});

// Rest of your code (tab switching, converters, history, etc.) remains the same...

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and sections
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.converter-section').forEach(s => s.classList.remove('active'));

        // Add active class to clicked tab and corresponding section
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const targetSection = document.querySelector(`.converter-section[data-tab="${tabId}"]`);

        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// Clipboard Functionality
function copyResult(elementId) {
    const text = document.getElementById(elementId).value;
    navigator.clipboard.writeText(text)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Copy failed:', err));
}

// Conversion History
let history = JSON.parse(localStorage.getItem('conversionHistory')) || [];

function addToHistory(entry) {
    history = [entry, ...history].slice(0, 10);
    localStorage.setItem('conversionHistory', JSON.stringify(history));
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history
        .map(entry => `<li class="history-item">
            <span>${entry.from} → ${entry.to}</span>
            <span>${new Date(entry.timestamp).toLocaleString()}</span>
        </li>`)
        .join('');
}

function clearHistory() {
    localStorage.removeItem('conversionHistory');
    history = [];
    updateHistoryDisplay();
}

// Converter Functions
// 1. Number Converter
function convertNumber() {
    const input = document.getElementById('numberInput').value.trim();
    const type = document.getElementById('numberType').value;
    let results = {};

    try {
        const decimalValue = type === 'dec' ? parseInt(input, 10) :
            type === 'bin' ? parseInt(input, 2) :
                type === 'hex' ? parseInt(input, 16) :
                    parseInt(input, 8);

        results = {
            dec: decimalValue.toString(10),
            bin: decimalValue.toString(2),
            hex: decimalValue.toString(16).toUpperCase(),
            oct: decimalValue.toString(8)
        };
    } catch (e) {
        results = { error: 'Invalid input format' };
    }

    document.getElementById('numberOutput').value = results.error ||
        `Decimal: ${results.dec}\nBinary: ${results.bin}\nHex: ${results.hex}\nOctal: ${results.oct}`;

    if (!results.error) addToHistory({
        from: `${type.toUpperCase()}: ${input}`,
        to: `Converted to all formats`,
        timestamp: Date.now()
    });
}

// 2. ASCII Converter
function convertAscii() {
    const input = document.getElementById('asciiInput').value.trim();
    const direction = document.getElementById('asciiDirection').value;
    let output = '';

    if (direction === 'toAscii') {
        output = input.split('').map(c => c.charCodeAt(0)).join(' ');
    } else {
        output = input.split(/[ ,]+/).map(code => {
            return String.fromCharCode(parseInt(code, 10));
        }).join('');
    }

    document.getElementById('asciiOutput').value = output;
    addToHistory({
        from: direction === 'toAscii' ? 'Text' : 'ASCII Codes',
        to: direction === 'toAscii' ? 'ASCII Codes' : 'Text',
        timestamp: Date.now()
    });
}

/// Color Converter Logic
document.getElementById('colorPicker').addEventListener('input', (e) => {
    document.getElementById('colorInput').value = e.target.value;
});

function convertColor() {
    const input = document.getElementById('colorInput').value.trim();
    const format = document.getElementById('colorFormat').value;
    let rgb = { r: 0, g: 0, b: 0 };

    try {
        // Parse input based on selected format
        switch (format) {
            case 'hex':
                rgb = hexToRgb(input);
                break;
            case 'rgb':
                rgb = parseRgb(input);
                break;
            case 'hsl':
                rgb = hslToRgb(input);
                break;
            case 'cmyk':
                rgb = cmykToRgb(input);
                break;
        }

        // Convert to all formats
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

        // Update UI
        document.getElementById('colorPreview').style.backgroundColor = hex;
        document.getElementById('colorOutput').value =
            `HEX: ${hex}\nRGB: ${rgbStr}\nHSL: ${hsl.h}°, ${hsl.s}%, ${hsl.l}%\nCMYK: ${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;

        addToHistory({
            from: `${format.toUpperCase()}: ${input}`,
            to: "All format conversions",
            timestamp: Date.now()
        });

    } catch (e) {
        document.getElementById('colorOutput').value = "Invalid color format!";
    }
}

// Conversion Functions
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function parseRgb(rgbStr) {
    const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
    if (!match) throw new Error('Invalid RGB format');
    return {
        r: Math.min(255, parseInt(match[1], 10)),
        g: Math.min(255, parseInt(match[2], 10)),
        b: Math.min(255, parseInt(match[3], 10))
    };
}

function hslToRgb(hslStr) {
    const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i);
    if (!match) throw new Error('Invalid HSL format');

    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10) / 100;
    const l = parseInt(match[3], 10) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r, g, b;

    if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function cmykToRgb(cmykStr) {
    const match = cmykStr.match(/cmyk\((\d+)%,\s*(\d+)%,\s*(\d+)%,\s*(\d+)%\)/i);
    if (!match) throw new Error('Invalid CMYK format');

    const c = parseInt(match[1], 10) / 100;
    const m = parseInt(match[2], 10) / 100;
    const y = parseInt(match[3], 10) / 100;
    const k = parseInt(match[4], 10) / 100;

    return {
        r: Math.round(255 * (1 - c) * (1 - k)),
        g: Math.round(255 * (1 - m) * (1 - k)),
        b: Math.round(255 * (1 - y) * (1 - k))
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function rgbToCmyk(r, g, b) {
    const c = 1 - (r / 255);
    const m = 1 - (g / 255);
    const y = 1 - (b / 255);
    const k = Math.min(c, m, y);

    return {
        c: Math.round(((c - k) / (1 - k) || 0) * 100),
        m: Math.round(((m - k) / (1 - k) || 0) * 100),
        y: Math.round(((y - k) / (1 - k) || 0) * 100),
        k: Math.round(k * 100)
    };
}

// 4. Base64 Converter
function encodeBase64() {
    const input = document.getElementById('base64Input').value;
    const encoded = btoa(unescape(encodeURIComponent(input)));
    document.getElementById('base64Output').value = encoded;
    addToHistory({
        from: 'Text',
        to: `Base64: ${encoded.slice(0, 20)}...`,
        timestamp: Date.now()
    });
}

function decodeBase64() {
    const input = document.getElementById('base64Input').value;
    try {
        const decoded = decodeURIComponent(escape(atob(input)));
        document.getElementById('base64Output').value = decoded;
        addToHistory({
            from: 'Base64',
            to: `Decoded text`,
            timestamp: Date.now()
        });
    } catch (e) {
        document.getElementById('base64Output').value = 'Invalid Base64 input';
    }
}

// JSON Converter
function convertJson() {
    const input = document.getElementById('jsonInput').value;
    const target = document.getElementById('jsonTarget').value;
    const outputElement = document.getElementById('jsonOutput');
    let output = '';

    try {
        const jsonObj = JSON.parse(input);

        if (target === 'xml') {
            output = jsonToXml(jsonObj);
        } else {
            output = jsonToYaml(jsonObj);
        }

        // Format and highlight output
        outputElement.innerHTML = '';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = target === 'xml' ? 'language-xml' : 'language-yaml';
        code.textContent = output;
        pre.appendChild(code);
        outputElement.appendChild(pre);

        // Highlight with Prism
        Prism.highlightElement(code);

    } catch (e) {
        outputElement.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }

    addToHistory({
        from: 'JSON',
        to: target.toUpperCase(),
        timestamp: Date.now()
    });
}

// Enhanced JSON to XML Converter
function jsonToXml(obj, indent = '') {
    let xml = '';
    const isArray = Array.isArray(obj);

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            xml += `${indent}<${key}>\n${jsonToXml(value, indent + '  ')}${indent}</${key}>\n`;
        } else {
            const typeAttr = typeof value !== 'string' ? ` type="${typeof value}"` : '';
            xml += `${indent}<${key}${typeAttr}>${value}</${key}>\n`;
        }
    }

    return isArray ? xml : xml.replace(/<\/?root>/g, '');
}

// JSON to YAML Converter
function jsonToYaml(obj, indent = 0) {
    const indentStr = ' '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
        obj.forEach(item => {
            yaml += `${indentStr}- ${typeof item === 'object'
                ? jsonToYaml(item, indent + 2)
                : formatValue(item)}\n`;
        });
    } else if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            yaml += `${indentStr}${key}: `;

            if (typeof value === 'object' && value !== null) {
                yaml += `\n${jsonToYaml(value, indent + 2)}`;
            } else {
                yaml += `${formatValue(value)}\n`;
            }
        }
    }

    return yaml;
}

function formatValue(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return value;
}

/// Enhanced Binary Converter
function convertBinary() {
    const input = document.getElementById('binaryInput').value.trim();
    const encoding = document.getElementById('binaryEncoding').value;
    const direction = document.getElementById('binaryDirection').value;
    let output = '';

    try {
        if (direction === 'binToText') {
            output = binaryToText(input, encoding);
        } else {
            output = textToBinary(input, encoding);
        }
    } catch (e) {
        output = `Error: ${e.message}`;
    }

    document.getElementById('binaryOutput').value = output;
    addToHistory({
        from: direction === 'binToText' ? 'Binary' : 'Text',
        to: direction === 'binToText' ? 'Text' : 'Binary',
        details: encoding.toUpperCase(),
        timestamp: Date.now()
    });
}

function binaryToText(binaryString, encoding) {
    const cleanInput = binaryString.replace(/\s+/g, ' ');
    const binaryArray = cleanInput.split(' ');

    return binaryArray.map(bin => {
        // Validate binary format
        if (!/^[01]{8,32}$/.test(bin)) {
            throw new Error(`Invalid binary sequence: ${bin}`);
        }

        const codePoint = parseInt(bin, 2);

        // Handle different encodings
        switch (encoding) {
            case 'ascii':
                if (codePoint > 255) throw new Error('ASCII only supports 8-bit values');
                return String.fromCharCode(codePoint);

            case 'utf8':
                return decodeURIComponent(escape(String.fromCodePoint(codePoint)));

            case 'utf16':
                if (codePoint > 0xFFFF) {
                    // Handle surrogate pairs for values > 0xFFFF
                    const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
                    const low = ((codePoint - 0x10000) % 0x400) + 0xDC00;
                    return String.fromCharCode(high, low);
                }
                return String.fromCharCode(codePoint);

            default:
                throw new Error('Unsupported encoding');
        }
    }).join('');
}

function textToBinary(textString, encoding) {
    return [...textString].map(char => {
        const codePoint = char.codePointAt(0);
        let binary;

        switch (encoding) {
            case 'ascii':
                if (codePoint > 255) throw new Error('Non-ASCII character detected');
                binary = codePoint.toString(2).padStart(8, '0');
                break;

            case 'utf8':
                // Simple UTF-8 encoding (basic multilingual plane)
                binary = codePoint.toString(2).padStart(16, '0');
                break;

            case 'utf16':
                // UTF-16LE encoding
                const buffer = new ArrayBuffer(2);
                new DataView(buffer).setUint16(0, codePoint, true);
                const bytes = new Uint8Array(buffer);
                binary = [...bytes].map(b => b.toString(2).padStart(8, '0')).join(' ');
                break;

            default:
                throw new Error('Unsupported encoding');
        }

        return binary;
    }).join(' ');
}

// 7. Time & Date Converter
function convertDateTime() {
    const dateInput = document.getElementById('dateTimeInput').value;
    const unixInput = document.getElementById('unixInput').value;
    let date;

    if (dateInput) {
        date = new Date(dateInput);
    } else if (unixInput) {
        date = new Date(parseInt(unixInput) * 1000);
    }

    const output = date ? `
        Local: ${date.toLocaleString()}
        UTC: ${date.toUTCString()}
        Unix: ${Math.floor(date.getTime() / 1000)}
    ` : 'Invalid date input';

    document.getElementById('dateOutput').value = output;
    addToHistory({
        from: dateInput ? 'DateTime' : 'Unix',
        to: 'Converted timestamp',
        timestamp: Date.now()
    });
}

// Modified CSV Converter
function convertCsv() {
    const csv = document.getElementById('csvInput').value;
    const target = document.getElementById('csvTarget').value;
    const outputElement = document.getElementById('csvOutput');
    outputElement.innerHTML = '';

    try {
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 1) throw new Error('No CSV data entered');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const output = target === 'json' ? 
            csvToJson(lines, headers) : 
            csvToSql(lines, headers);

        // Create formatted output
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = `language-${target === 'json' ? 'json' : 'sql'}`;
        code.textContent = output;
        pre.appendChild(code);
        outputElement.appendChild(pre);
        
        // Force Prism to re-parse
        Prism.highlightElement(code);

    } catch (e) {
        outputElement.innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }

    addToHistory({
        from: 'CSV',
        to: target.toUpperCase(),
        timestamp: Date.now()
    });
}

function csvToJson(lines, headers) {
    const json = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, i) => {
            obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
            return obj;
        }, {});
    });
    return JSON.stringify(json, null, 2);
}

function csvToSql(lines, headers) {
    return `CREATE TABLE table_name (\n  ${headers.join(' VARCHAR(255),\n  ')} VARCHAR(255)\n);\n\n` +
        lines.slice(1).map(line =>
            `INSERT INTO table_name (${headers.join(', ')}) VALUES (${line.split(',').map(v => `'${v.trim()}'`).join(', ')});`
        ).join('\n');
}

// Custom copy handler for CSV output
function copyCSVOutput() {
    const codeElement = document.querySelector('#csvOutput code');
    if (codeElement) {
        navigator.clipboard.writeText(codeElement.textContent)
            .then(() => alert('Copied to clipboard!'))
            .catch(err => console.error('Copy failed:', err));
    }
}

// 9. URL Converter
function convertUrl() {
    const input = document.getElementById('urlInput').value;
    const operation = document.getElementById('urlOperation').value;
    const output = operation === 'encode' ?
        encodeURIComponent(input) :
        decodeURIComponent(input);

    document.getElementById('urlOutput').value = output;
    addToHistory({
        from: operation === 'encode' ? 'URL' : 'Encoded URL',
        to: operation === 'encode' ? 'Encoded' : 'Decoded',
        timestamp: Date.now()
    });
}

// 10. File Converter
async function convertFile() {
    const fileInput = document.getElementById('fileInput');
    const conversion = document.getElementById('fileConversion').value;

    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        let output = '';
        // Simple text-based conversion example
        if (conversion === 'pdf-txt') {
            output = 'PDF to text conversion requires external libraries';
        } else if (conversion === 'md-html') {
            output = e.target.result.replace(/#{1,6}/g, m => `<h${m.length}>`);
        }

        document.getElementById('fileOutput').value = output;
        addToHistory({
            from: file.name,
            to: conversion.split('-')[1].toUpperCase(),
            timestamp: Date.now()
        });
    };

    reader.readAsText(file);
}

// Initialize
updateHistoryDisplay();