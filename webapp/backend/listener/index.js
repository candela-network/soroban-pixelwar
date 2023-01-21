const SorobanClient = require('soroban-client')
const StellarSdk = require('stellar-sdk')
const axios = require('axios')
const Jimp = require('jimp');


var START = 165934
const RPC_URL = "https://futurenet.candela.network:443/soroban/rpc"
const HORIZON = new StellarSdk.Server("https://futurenet.candela.network")


var image = new Jimp(100, 100)

var main = async () => {

    let id = 100000;
    let modified = false;
    try {

        let stop = (await HORIZON.ledgers().order("desc").limit(1).call()).records[0].sequence
        console.log("Loading from " + START + " to " + stop)
        for (let start = START; start <= stop; start += 4001) {

            id++
            let response = await axios.post(RPC_URL, {
                "jsonrpc": "2.0",
                "id": id,
                "method": "getEvents",
                "params": {
                    "startLedger": "" + (start),
                    "endLedger": "" + (start + 4000),
                    "filters": [{ contractIds: ["7265e1d967a22a62951c52564bad4d857b188961f5eeec778e47f56fe2e03c7d"] }],
                    "pagination": {
                        "limit": 100
                    }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            })

            let data = response.data
            if (data.result && data.result.length > 0) {
                for (let r of data.result) {
                    console.log(r.topic)
                    let val = SorobanClient.xdr.ScVal.fromXDR(r.value.xdr, 'base64')

                    let vec = val.obj().vec()
                    let x = vec[0].obj().vec()[0].u32()
                    let y = vec[0].obj().vec()[1].u32()
                    let c = vec[1].obj().bin()

                    console.log(x + ", " + y + ", " + c.toString('hex'))
                    let color = Jimp.rgbaToInt(c[0], c[1], c[2], 0xff)
                    image.setPixelColor(color, x, y)
                    modified = true;
                }
            }
        }

        START = stop

    } catch (e) {
        console.log(e)
    }

    if (modified) {

        image.write('test.png', (err) => {
            if (err) throw err;
        });
    }

    // image.getBase64(Jimp.MIME_PNG, (err, value) => {
    //     console.log("size: " + value.length)
    // })
}

setInterval(
    main, 5000)