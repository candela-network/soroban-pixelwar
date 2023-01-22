const SorobanClient = require('soroban-client')

class PixelWarConfig {
    constructor(opt) {
        this.start = opt.start;
        this.end = opt.end;
        this.width = opt.width;
        this.height = opt.height;
        this.maxx = opt.max;
    }

    static fromXDR(s) {
        let x = SorobanClient.xdr.ScVal.fromXDR(s, 'base64')
        let object = {}
        let arr = x.obj().map();
        console.log(arr)
        for (let e of arr) {
            let name = String.fromCharCode(...e.key().sym())

            switch (name) {
                case "start":
                    let st = e.val().obj().u64()
                    object.start = (st.high << 32) + st.low
                    break;
                case "end":
                    let en = e.val().obj().u64()
                    object.end = (en.high << 32) + en.low
                    break;
                case "width":
                    object.width = e.val().u32()
                    break;
                case "height":
                    object.height = e.val().u32()
                    break;
                case "max":
                    object.max = e.val().u32()
                    break;

                default:
            }
        }

        return new PixelWarConfig(object)
    }
};


class Pixel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toXDR(format) {
        return SorobanClient.xdr.ScVal.scvObject(
            SorobanClient.xdr.ScObject.scoVec([
                SorobanClient.xdr.ScVal.scvU32(this.x),
                SorobanClient.xdr.ScVal.scvU32(this.y),
            ])
        ).toXDR(format);


    }//: 'hex' | 'base64'): string;

};

class Color {
    r;
    g;
    b;
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toString() {
        return '#' + this.r.toString(16).padStart(2, '0') + this.g.toString(16).padStart(2, '0') + this.b.toString(16).padStart(2, '0')
    }

    toXDR(format) {
        return SorobanClient.xdr.ScVal.scvObject(
            SorobanClient.xdr.ScObject.scoBytes([this.r, this.g, this.b])
        ).toXDR(format);
    }

    static fromXDR(s) {
        let x = SorobanClient.xdr.ScVal.fromXDR(s, 'base64')
        return new Color(x.obj().bin()[0], x.obj().bin()[1], x.obj().bin()[2])
    }
};

class Player {
    id;
    constructor(id) {
        this.id = id
    }

    toXDR(format) {
        return SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoVec([
            SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoVec([
                SorobanClient.xdr.ScVal.scvSymbol("Account"),
                SorobanClient.xdr.ScVal.scvObject(
                    SorobanClient.xdr.ScObject.scoAccountId(SorobanClient.xdr.PublicKey.publicKeyTypeEd25519(SorobanClient.Keypair.fromPublicKey(this.id).rawPublicKey()))
                )
            ]))
        ]))

            .toXDR(format);
    }

    static fromXDR(s) {
        console.log(s)
        let x = SorobanClient.xdr.ScVal.fromXDR(s, 'base64')
        return x.u32()
    }
}

function decorateFootprint(t, footprint) {
    if (footprint) {
        let source = new SorobanClient.Account(t.source, `${parseInt(t.sequence) - 1}`);
        let op = SorobanClient.Operation.invokeHostFunction({
            function: t.operations[0].function,
            parameters: t.operations[0].parameters,
            footprint: SorobanClient.xdr.LedgerFootprint.fromXDR(footprint, 'base64'),
        })

        // console.log(call)
        return new SorobanClient.TransactionBuilder(source, {
            fee: '1000',
            networkPassphrase: SorobanClient.Networks.FUTURENET,
        })
            .addOperation(
                op
            )
            .setTimeout(0)
            .build();
    }

    return t;
}

class PixelWarContract {
    constructor(id) {
        this.contract = new SorobanClient.Contract(id);
    }

    authorize(source, accountId, footprint) {
        let rawAccount = SorobanClient.Keypair.fromPublicKey(accountId).rawPublicKey().toString('hex')
        let t = new SorobanClient.TransactionBuilder(source, {
            fee: '100',
            networkPassphrase: SorobanClient.Networks.FUTURENET,
        })
            .addOperation(
                this.contract.call(
                    "authorize",
                    SorobanClient.xdr.ScVal.scvObject(
                        SorobanClient.xdr.ScObject.scoVec(
                            [
                                SorobanClient.xdr.ScVal.scvSymbol("Account"),
                                SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoAccountId(SorobanClient.xdr.PublicKey.publicKeyTypeEd25519(rawAccount)))
                            ]
                        )
                    )))
            .setTimeout(SorobanClient.TimeoutInfinite)
            .build();

        return decorateFootprint(t, footprint);
    }

    revoke(source, accountId, footprint) {
        let rawAccount = SorobanClient.Keypair.fromPublicKey(accountId).rawPublicKey().toString('hex')
        let t = new SorobanClient.TransactionBuilder(source, {
            fee: '100',
            networkPassphrase: SorobanClient.Networks.FUTURENET,
        })
            .addOperation(
                this.contract.call(
                    "revoke",
                    SorobanClient.xdr.ScVal.scvObject(
                        SorobanClient.xdr.ScObject.scoVec(
                            [
                                SorobanClient.xdr.ScVal.scvSymbol("Account"),
                                SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoAccountId(SorobanClient.xdr.PublicKey.publicKeyTypeEd25519(rawAccount)))
                            ]
                        )
                    )))
            .setTimeout(SorobanClient.TimeoutInfinite)
            .build();

        return decorateFootprint(t, footprint)
    }

    draw(source, x, y, color, footprint) {

        let t = new SorobanClient.TransactionBuilder(source, {
            fee: '1000',
            networkPassphrase: SorobanClient.Networks.FUTURENET,
        })
            .addOperation(

                this.contract.call(
                    "draw",
                    SorobanClient.xdr.ScVal.scvU32(x),
                    SorobanClient.xdr.ScVal.scvU32(y),
                    SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoBytes(color)
                    )
                )
            )
            .setTimeout(0)
            .build();

        return decorateFootprint(t, footprint);
    }

    async getConfig(server) {
        try {
            let response = await server.getContractData(this.contract.contractId(), GAME);
            console.log(response)
            return PixelWarConfig.fromXDR(
                response.xdr
            )
        } catch {
            return undefined
        }
    }

    async getPixelColor(server, x, y) {
        try {
            let response = await server.getContractData(this.contract.contractId(), new Pixel(x, y));
            return Color.fromXDR(
                response.xdr
            )
        } catch {
            return undefined
        }

    }

    async getPlayerCredits(server, id) {
        try {
            let response = await server.getContractData(this.contract.contractId(), new Player(id));
            console.log(response)
            return Player.fromXDR(
                response.xdr
            )
        } catch (e) {

            console.log(e)
            return undefined
        }

    }

}

const GAME = SorobanClient.xdr.ScVal.scvSymbol("GAME");
const ADMIN = SorobanClient.xdr.ScVal.scvSymbol("ADMIN");

// export { GAME, ADMIN, PixelWarConfig, Pixel, Color, Player, PixelWarContract };

module.exports = { GAME, ADMIN, PixelWarConfig, Pixel, Color, Player, PixelWarContract };