import parse from 'rxn-parser';

export function getFormat(rxnData, OCL) {
    var {
        reagents,
        products
    } = parse(rxnData);

    reagents = reagents.map(elem => {
        var output = {};
        var mol = OCL.Molecule.fromMolfile(elem);
        output.ocl = mol.getIDCodeAndCoordinates();
        output.kind = 'starting material';

        return output;
    });

    products = products.map(elem => {
        var output = {};
        var mol = OCL.Molecule.fromMolfile(elem);
        output.ocl = mol.getIDCodeAndCoordinates();

        return output;
    });


    return {
        reagents: reagents,
        products: products,
        conditions: ''
    };
}

export function organizeData(data, catPrefix, OCL) {
    var oclMap = getOCLMap(OCL);
    var output = {
        products: data.products.map(oclMap),
        text: getText(data, catPrefix, oclMap)
    };

    var starting = [];
    var reagents = [];


    for (var i = 0; i < data.reagents.length; ++i) {
        var current = data.reagents[i];
        switch (current.kind) {
            case 'reagent':
                reagents.push(oclMap(current));
                break;
            case 'starting material':
                starting.push(oclMap(current));
                break;
            default:
        }
    }

    output.starting = starting;
    output.reagents = reagents;

    return output;
}

function getOCLMap(OCL) {
    return (elem) => OCL.Molecule.fromIDCode(elem.ocl.idCode);
}

function getText(data, catPrefix, oclMap) {
    var output = {
        products: []
    };

    var arrow = [];

    // add catalyst
    var catalyst = data.reagents.find(elem => elem.kind === 'catalyst');
    if (catalyst) {
        if (catPrefix) {
            arrow.push('Cat. ');
        }
        arrow.push(splitShortName(oclMap(catalyst).getMolecularFormula().formula));
    }

    // add solvent
    var solvent = data.reagents.find(elem => elem.kind === 'solvent');
    if (solvent) {
        arrow.push(splitShortName(oclMap(solvent).getMolecularFormula().formula));
    }

    arrow.push(data.conditions.replace(/(<([^>]+)>)|\n/ig, ''));
    var products = data.products;
    var bestYieldStr = '';
    if (products.length === 1) {
        bestYieldStr = `Best yield: ${String(products[0].yield)} %`;
    } else if (products.length > 1) {
        var bestYield = -1;
        for (var i = 0; i < products.length; ++i) {
            var currentProduct = products[i];
            output.products.push(`${String(currentProduct.yield)} %`);
            if (currentProduct.yield > bestYield) {
                bestYield = currentProduct.yield;
            }
        }
        bestYieldStr = `Best yield: ${String(bestYield)} %`;
    }

    arrow.push(bestYieldStr);
    output.arrow = arrow;

    return output;
}

function splitShortName(shortName) {
    var regexps = [/[A-Za-z]/, /\d/];
    var index = 0;
    var currentRegex = regexps[index];
    var output = [];
    var str = '';
    for (var i = 0; i < shortName.length; ++i) {
        if (currentRegex.test(shortName[i])) {
            str += shortName[i];
        } else {
            output.push(str);
            str = shortName[i];
            index = (index + 1) % 2;
            currentRegex = regexps[index];
        }
    }
    output.push(str);
    return output;
}
