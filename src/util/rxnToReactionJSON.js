import parse from 'rxn-parser';

export default function rxnToReactionJSON(rxnData, OCL) {
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
