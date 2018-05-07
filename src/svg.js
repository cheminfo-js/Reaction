import window from 'svgdom';
import SVG from 'svg.js';
window.setFontDir(__dirname + '/fonts').setFontFamilyMappings({
    ' Helvetica': 'Helvetica-Regular.ttf'
}).preloadFonts();
var svg = SVG(window);
var document = window.document;
export {
    svg as SVG,
    document as document
};
