
class PixelWar {
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

        return new PixelWar(object)
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

class PixelWarContract {
    constructor(id) {
        this.contract = new SorobanClient.Contract(id);
    }

    authorize(source, accountId) {
        return new SorobanClient.TransactionBuilder(source, {
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
                                SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoAccountId(SorobanClient.xdr.PublicKey.publicKeyTypeEd25519(accountId)))
                            ]
                        )
                    )))
            .setTimeout(SorobanClient.TimeoutInfinite)
            .build();
    }

    revoke(source, accountId) {
        return new SorobanClient.TransactionBuilder(source, {
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
                                SorobanClient.xdr.ScVal.scvObject(SorobanClient.xdr.ScObject.scoAccountId(SorobanClient.xdr.PublicKey.publicKeyTypeEd25519(accountId)))
                            ]
                        )
                    )))
            .setTimeout(SorobanClient.TimeoutInfinite)
            .build();
    }

    draw(source, x, y, color) {
        return new SorobanClient.TransactionBuilder(source, {
            fee: '100',
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
            .setTimeout(SorobanClient.TimeoutInfinite)
            .build();
    }

}

const GAME = SorobanClient.xdr.ScVal.scvSymbol("GAME");
const ADMIN = SorobanClient.xdr.ScVal.scvSymbol("ADMIN");

export { GAME, ADMIN, PixelWar, Pixel, Color, PixelWarContract };