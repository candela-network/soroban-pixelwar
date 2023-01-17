
// var SorobanClient = require("soroban-client")
import { GAME, PixelWar, Pixel, Color, PixelWarContract } from './pixelwar.js';
console.log(SorobanClient);

const pixelWarContractId = "1cdabe394023ce8359a696c47c3b28e4d85b81d6028ad4264bd78e58e4cc0bde"
const RPC = new SorobanClient.Server("http://127.0.0.1:8000/soroban/rpc", { allowHttp: true })
var xdr = SorobanClient.xdr;





let param = GAME;
let res = await RPC.getContractData(pixelWarContractId, param)
// let result = SorobanClient.xdr.ScVal.fromXDR(res.xdr, 'base64')
console.log(res)
console.log(PixelWar.fromXDR(res.xdr))

for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        let param = new Pixel(i, j);
        try {
            let res = await RPC.getContractData(pixelWarContractId, param)
            let result = SorobanClient.xdr.ScVal.fromXDR(res.xdr, 'base64')
            console.log(res.xdr)
            let color = Color.fromXDR(res.xdr);
            console.log("Color:" + color)
            try {
                console.log("ColorXDR :" + color.toXDR('base64'))
            } catch (e) {
                console.log(e)
            }
        } catch (e) {
            // console.log(e)
        }

    }
}

let kp = SorobanClient.Keypair.fromSecret("SAVFSY2DEROLSCXIW36Q2VM67GSCPMXQHJMLXQWIR3LIL55VLMCDOSPD")
let srcAccountId = kp.publicKey()
let account =  await RPC.getAccount(srcAccountId);
console.log(account)
let source = new SorobanClient.Account(account.id, account.sequence)

let pwcontract = new PixelWarContract(pixelWarContractId)

let t = pwcontract.draw(source, 7, 8, [1, 2, 3])
t.sign(kp)
let {id} = await RPC.sendTransaction(t)

let status = "pending"
while (status == "pending") {
    let response = await RPC.getTransactionStatus(id)
    status = response.status;
    switch (response.status) {
        
        case "success": {
            console.log(response.results)
        };
        break;
        default:
    }
}

