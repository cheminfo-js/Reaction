import Reaction from '..';
import OCL from 'openchemlib';

describe('Main test', () => {
    test('Basic test', () => {
        var data = require('../../data/noProducts.json');
        var reaction = Reaction.fromJSON(data, {});
        reaction.setOCL(OCL);
        //expect(2).toBe(2);
        reaction.toSVG();
    });
});
