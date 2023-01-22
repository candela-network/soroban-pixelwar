const  {PixelWarContract}  = require("./pixelwar.js");
const SorobanClient = require('soroban-client')

const secret = ""
const KP = SorobanClient.Keypair.fromSecret(secret)
const RPC = new SorobanClient.Server("https://futurenet.candela.network:443/soroban/rpc")

const contract_id = "aa8f8900fdbabc4a45297a52822b803fec120fe17300048d1e07aad1476095f4"

var draw = async (x, y, color) => {

    //
    // Define the coordinate and the color to draw
    //
    // let x = 42
    // let y = 60
    // let color = [0, 128, 255]

    //
    // Build the draw() function call transaction to get the footprint
    //

    let account = await RPC.getAccount(KP.publicKey());
    let source = new SorobanClient.Account(account.id, account.sequence)
    let contract = new PixelWarContract(contract_id)
    let simTransaction = contract.draw(source, x, y, color)
    simTransaction.sign(KP)
    let simResult = await RPC.simulateTransaction(simTransaction)

    //
    // Build the draw() function call transaction and send it
    //
    account = await RPC.getAccount(KP.publicKey());
    source = new SorobanClient.Account(account.id, account.sequence)
    let t = contract.draw(source, x, y, color, simResult.footprint)
    t.sign(KP)
    let { id } = await RPC.sendTransaction(t)

    let status = "pending"
    while (status == "pending") {
        let response = await RPC.getTransactionStatus(id)
        status = response.status;
        switch (response.status) {
            case "pending":
                continue;
            default:
                console.log(response.status)
        }
    }
}

draw(42, 61, [128, 255, 0])