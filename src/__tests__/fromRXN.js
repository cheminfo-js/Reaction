import Reaction from '..';
import OCL from 'openchemlib';
import fs from 'fs';

describe('from RXN', () => {
    test('diethylisobutyramide', () => {
        var rxn = fs.readFileSync(__dirname + '/../../data/test.rxn', 'utf8');
        Reaction.setOCL(OCL);
        var reaction = Reaction.fromRXN(rxn, {});
        var svg = reaction.toSVG();
        console.log(svg);
    });
});
