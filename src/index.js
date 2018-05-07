import {
    organizeData
} from './utils';
import {SVG, document} from './svg';

import rxnToReactionJSON from './util/rxnToReactionJSON';

const config = {
    DISTANCE: 10, // separation distance between elements of the svg
    SVG_OPTIONS: { // configuration for the svg retrieved from OCL
        suppressChiralText: true,
        suppressCIPParity: true,
        suppressESR: true,
        noStereoProblem: true
    }
};

export default class Reaction {
    constructor(data, options) {
        this.data = data;

        var {
            catPrefix = false,
            font = {
                family: 'Helvetica',
                anchor: 'middle',
                size: 15
            },
            domElement
        } = options;

        this.catPrefix = catPrefix;
        this.font = font;
        this.domElement = domElement;
    }

    static setOCL(OCL) {
        Reaction.OCL = OCL;
    }

    static fromJSON(reactionJSON, options) {
        return new Reaction(reactionJSON, options);
    }

    static fromRXN(reactionRXN, options) {
        checkOCL();
        let reactionJSON = rxnToReactionJSON(reactionRXN, Reaction.OCL);
        return Reaction.fromJSON(reactionJSON, options);
    }

    toSVG() {
        checkOCL();
        var data = organizeData(this.data, this.catPrefix, Reaction.OCL);
        console.log(data);
        var context = SVG(document.documentElement);
        draw(context, data, this.font);

        return context.svg();
    }
}

function checkOCL() {
    if (!Reaction.OCL) {
        throw new Error('This library requires an instance OCL. Please use Reaction.setOCL(OCL) before using it');
    }
}

const distance = 10;

function draw(context, data, font) {
    var {
        starting,
        reagents,
        products,
        text
    } = data;

    var selectedFont = font;

    var output = context.group();
    var startingGroup = drawGroup(context, starting, {
        joinBy: '+',
        font: selectedFont
    });

    var reagentsGroup = drawGroup(context, reagents, {
        joinBy: '',
        isVertical: true
    });
    output.add(startingGroup);
    output.add(reagentsGroup);

    var startingBox = startingGroup.rbox(context);
    // var reagentBox = reagentsGroup.rbox(context);

    // put catalyst over the arrow
    var subFont = Object.assign({}, selectedFont, {
        'baseline-shift': 'sub',
        'font-size': 'small'
    });
    var arrowBelow = context.text(function (add) {
        for (var i = 0; i < text.arrow.length; ++i) {
            var currentText = text.arrow[i];
            if (Array.isArray(currentText)) {
                // process MF
                for (var j = 0; j < currentText.length; ++j) {
                    var a = add.tspan(currentText[j]);
                    if (j % 2 === 1) {
                        a.font(subFont);
                    } else {
                        a.font(selectedFont);
                    }
                }
            } else if (currentText !== '') {
                add.tspan(currentText).font(selectedFont);
                if (currentText === 'Cat. ') {
                    continue;
                }
            }
            add.tspan(' ').font(selectedFont).newLine();
        }
    });

    //arrowBelow.font(selectedFont);
    var arrowBelowBox = arrowBelow.rbox(context);
    arrowBelow.move(startingBox.x2 + arrowBelowBox.width / 2.0 + config.DISTANCE, startingBox.cy + config.DISTANCE);

    var reagentsBox = reagentsGroup.rbox(context);
    reagentsGroup.dmove(startingBox.width / 2.0 + reagentsBox.width / 2.0 + config.DISTANCE,
        startingBox.cy - reagentsBox.cy - (reagentsBox.height / 2.0) - config.DISTANCE);

    var arrowWidth = distance;
    reagentsBox = reagentsGroup.rbox(context);
    arrowBelowBox = arrowBelow.rbox(context);

    if (arrowBelowBox.width > reagentsBox.width) {
        arrowWidth += arrowBelowBox.width;
        var moveCata = arrowWidth / 2.0 - reagentsBox.width / 2.0;
        var moveBelow = config.DISTANCE / 2.0;
    } else {
        arrowWidth += reagentsBox.width;
        moveCata = config.DISTANCE / 2.0;
        moveBelow = arrowWidth / 2.0 - arrowBelowBox.width / 2.0;
    }
    reagentsGroup.x(reagentsGroup.x() + moveCata);

    arrowBelow.x(arrowBelow.x() + moveBelow);
    var arrow = makeArrow(context, startingBox.x2 + config.DISTANCE, startingBox.cy, arrowWidth);

    // once we have it on the right position we can shrink it
    var prevWidth = reagentsGroup.rbox(context).w;
    reagentsGroup.transform({
        scale: 0.8
    });
    var width = reagentsGroup.rbox(context).w;
    reagentsGroup.dmove(0, prevWidth - width - config.DISTANCE);


    output.add(arrow);
    output.add(arrowBelow);

    var outputBBox = output.rbox(context);
    var productsGroup = drawGroup(context, products, {
        labels: text.products,
        isVertical: false,
        joinBy: '+',
        font: selectedFont
    });
    var productsBox = productsGroup.rbox(context);
    productsGroup.dmove(Math.abs(outputBBox.x2 - productsBox.x) + config.DISTANCE, 0);

    output.add(productsGroup);

    outputBBox = output.rbox(context);
    context.size(outputBBox.x + outputBBox.width, outputBBox.y + outputBBox.height);
}

function makeArrow(context, x, y, width) {
    var arrow = context.group();
    arrow.line(x, y, x + width, y).stroke({
        width: 1
    });
    var triangle = arrow.polygon([0, 0, 7, 7, 0, 7]);
    triangle.center(x + width, y).rotate(-135);
    return arrow;
}

function getGroup(context, svg) {
    var g1 = context.group();
    g1.svg(svg);
    var b = g1.rbox(context);
    g1.move(-b.x, -b.y);

    return g1;
}

function move(elem, x, y) {
    elem.center(elem.x() + x, elem.y() + y);
}

const svgOptions = {
    suppressChiralText: true,
    suppressCIPParity: true,
    suppressESR: true,
    noStereoProblem: true
};

function drawGroup(context, array, options) {
    var {
        joinBy,
        isVertical,
        labels,
        font
    } = options;

    var group = context.group();
    var currentX = 100;
    var currentY = 100;
    for (var i = 0; i < array.length; ++i) {
        var currentReagent = array[i];
        var currentSVG = currentReagent.toSVG(200, 200, String(i), svgOptions);
        var elem = getGroup(context, currentSVG);

        if (joinBy && i > 0) {
            var text = group.text(joinBy);
            text.center(currentX, currentY);
            var reagentBox = elem.rbox(context);
            var dist = config.DISTANCE + reagentBox.width / 2.0;
            if (isVertical) {
                currentY += dist;
            } else {
                currentX += dist;
            }
        }

        move(elem, currentX, currentY);
        var box = elem.rbox(context);
        if (labels && labels[i]) {
            text = group.text(labels[i]);
            text.font(font);
            text.move(box.cx, box.cy + 20);
        }

        dist = config.DISTANCE + box.width / 2.0;
        if (isVertical) {
            currentY += dist;
        } else {
            currentX += dist;
        }
        group.add(elem);
    }
    group.move(100, 100);

    return group;
}
