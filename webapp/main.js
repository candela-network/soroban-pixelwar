
import { PixelWarContract } from './pixelwar.js';



let configResponse = await fetch("./config.json")
let config = await configResponse.json()

const dapp_url = config.dapp_url
const auth_url = config.auth_url
const result_img = config.result_img
const pixelWarContractId = config.contract_id

const RPC = new SorobanClient.Server(config.rpc_url)
const pixelWarContract = new PixelWarContract(pixelWarContractId);

// Config, can be used to dynamically load the canvas
let pwconfig = await pixelWarContract.getConfig(RPC)

// console.log(config)

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// Call the contract draw() function
async function setPixel(x, y, color) {


    document.getElementById('setpixel').disabled = true;

    try {

        let account = await RPC.getAccount(getPubkey());
        let source = new SorobanClient.Account(account.id, account.sequence)

        // let pwcontract = new PixelWarContract(pixelWarContractId)

        let t = pixelWarContract.draw(source, x, y, color)
        t.sign(getKeypair())

        let sim = await RPC.simulateTransaction(t)
        console.log(sim)

        account = await RPC.getAccount(getPubkey());
        source = new SorobanClient.Account(account.id, account.sequence)
        let t2 = pixelWarContract.draw(source, x, y, color, sim.footprint)
        t2.sign(getKeypair())
        let { id } = await RPC.sendTransaction(t2)

        let status = "pending"
        while (status == "pending") {
            let response = await RPC.getTransactionStatus(id)
            status = response.status;
            switch (response.status) {

                case "success": {
                    console.log(response.results)
                    document.getElementById("feedback").innerHTML = `success!`
                };
                    break;
                case "error":
                    console.log(response)
                    document.getElementById("feedback").innerHTML = "oops, an  error occured!"
                    break;
                default:
                    await sleep(1000)
            }
        }

        main()
    } finally {
        document.getElementById('setpixel').disabled = false;
    }
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function getUsername() {
    return getUser().username + '#' + getUser().discriminator
}

function getUser() {
    return JSON.parse(localStorage.getItem("discord"))
}

function getDiscordId() {
    return getUser().id
}

function getAvatarImg() {
    return "https://cdn.discordapp.com/avatars/" + getDiscordId() + "/" + getUser().avatar + ".png"
}

function hasKeypair() {
    return localStorage.getItem("state") != null
}
function getKeypair() {
    let s = JSON.parse(localStorage.getItem("state")).s
    return SorobanClient.Keypair.fromRawEd25519Seed(hextoarr(s))
}

function storeKeypair(s) {
    let kp = SorobanClient.Keypair.fromSecret(s)
    localStorage.setItem("state", JSON.stringify({
        p: kp.rawPublicKey().toString('hex'),
        s: kp.rawSecretKey().toString('hex')
    }))
}

function hextoarr(hexString) {
    var pairs = hexString.match(/[\dA-F]{2}/gi);

    // convert the octets to integers
    var integers = pairs.map(function (s) {
        return parseInt(s, 16);
    });

    var array = new Uint8Array(integers);
    return array.buffer;
}

function getPubkey() {
    return getKeypair().publicKey()
}


async function main() {

    document.getElementById('username').innerText = getUsername();

    document.getElementById('avatar').src = getAvatarImg()
    document.getElementById('pubkey').innerText = getPubkey().substr(0, 4) + "..." + getPubkey().substr(52);
    document.getElementById('container').style.display = 'block'

    console.log(getPubkey())
    console.log(SorobanClient.Keypair.fromPublicKey(getPubkey()).rawPublicKey().toString('hex'))
    let credits = await pixelWarContract.getPlayerCredits(RPC, getPubkey())
    document.getElementById('credits').innerHTML = credits;
}



function computeXY(canvas, penSize, e) {

    let rect = canvas.getBoundingClientRect();
    let scaleX = (rect.right - rect.left) / canvas.width;
    let scaleY = (rect.bottom - rect.top) / canvas.height;

    if (e) {
        return {
            x: parseInt((e.clientX - rect.left) / scaleX),
            y: parseInt((e.clientY - rect.top) / scaleY)
        };
    }
    return [];

}



document.getElementById('setpixel').addEventListener('click', event => {

    let x = document.getElementById('px').value
    let y = document.getElementById('py').value
    let color = document.getElementById('colorpicker').value

    console.log(x + ", " + y + ", " + hexToBytes(color.substr(1)))
    setPixel(Number(x), Number(y), hexToBytes(color.substr(1)))

})

document.getElementById('pwimage').addEventListener('click', e => {

    let ratio = 6;
    let canvas = document.getElementById('pwimage')

    var pos = computeXY(canvas, ratio, e);
    var x = pos.x; //e.pageX - pos.x;
    var y = pos.y; //e.pageY - pos.y;
    var c = canvas.getContext('2d');
    var p = c.getImageData(x, y, ratio, ratio).data;

    // document.getElementById('px').value = Math.floor(x / ratio);;
    // document.getElementById('py').value = Math.floor(y / ratio);;
    // document.getElementById('colorpicker').value = '#' + p[0].toString(16).padStart(2, '0')
    //     + p[1].toString(16).padStart(2, '0')
    //     + p[2].toString(16).padStart(2, '0');

    setXY(Math.floor(x / ratio), Math.floor(y / ratio))
    setColor('#' + p[0].toString(16).padStart(2, '0')
        + p[1].toString(16).padStart(2, '0')
        + p[2].toString(16).padStart(2, '0')
    )
})

function setXY(x, y) {
    document.getElementById('px').value = x;
    document.getElementById('py').value = y;
}

function setColor(color) {
    document.getElementById('colorpicker').value = color;
}

var clickReveal = document.getElementById('secretKey').addEventListener('click', e => {
    if (document.getElementById('secretKey').innerHTML.length < 56) {

        document.getElementById('secretKey').innerHTML = getKeypair().secret()
    }

})
// document.getElementById('secretKey').addEventListener('mouseleave', e => {
//     document.getElementById('secretKey').innerHTML = "[click to reveal]"
// })

function displayLogin() {
    let st = JSON.parse(localStorage.getItem("state"))
    let state = st.p;
    let url = config.oauth_url + "&state=" +state

    document.getElementById('login').href = url;
    document.getElementById('login').style.display = 'block'
}

// Display and update the pixel war canvas
var refresh = async () => {

    let remaining = pwconfig.end - parseInt(Date.now() / 1000);
    if (remaining > 0) {
        var days = Math.floor(remaining / ( 60 * 60 * 24));
        var hours = Math.floor((remaining % ( 60 * 60 * 24)) / (60 * 60));
        var minutes = Math.floor((remaining % ( 60 * 60)) / ( 60));
        var seconds = Math.floor((remaining % ( 60)) );
        document.getElementById("remaining").innerHTML = "Time left: " + days + "d " + hours + "h "
            + minutes + "m " + seconds + "s ";

    } else {
        document.getElementById("remaining").innerHTML = `Expired`
    }


    let canvas = document.getElementById('pwimage')
    let ctx = canvas.getContext('2d');
    let img = new Image()

    img.onload = function () {
        //draw background image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 600, 600);
    };
    img.src = result_img

    setTimeout(refresh, 10000)
}
refresh()


let lastOperations = []
function updateHistory() {
    let str = '<table style="width: 100%;">'
    str += "<tr>"
    str += "<th colspan='2'>"
    str += "YOUR HISTORY"
    str += "</th>"
    str += "</tr>"

    str += "<tr>"
    str += "<th>"
    str += "DATE"
    str += "</th>"
    str += "<th>"
    str += "FUNCTION CALL"
    str += "</th>"
    str += "</tr>"
    for (let entry of lastOperations) {
        str += "<tr>"
        str += "<td>"
        str += entry.date
        str += "</td>"
        str += "<td>"
        str += `draw(${entry.x}, ${entry.y}, #${entry.color})`
        str += "</td>"
        str += "</tr>"
    }
    str += "</table>"
    document.getElementById("history").innerHTML = str
}
//
// When the user is not authenticated yet
//
if (!getUser()) {
    const fragment = new URLSearchParams(window.location.search);
    var code = fragment.get('code');
    var backstate = fragment.get('state')

    // console.log("Got code: " + code)
    // console.log("Got state: " + backstate)

    if (!code) {

        storeKeypair(SorobanClient.Keypair.random().secret())
        displayLogin()

    } else {
        document.getElementById("feedback").innerHTML = "Loading..."
        document.getElementById("loader").style.display = 'grid'
        let state = getKeypair().rawPublicKey().toString('hex')
        if (state != backstate) {
            console.log("Inconsistent state, you may have been clickjacked")
        } else {

            // document.getElementById('info').style.display = 'block'

            let result = await fetch(auth_url + '?code=' + code + "&state=" + state)
            let response = await result.json()

            if (response.user) {
                localStorage.setItem("discord", JSON.stringify(response.user))
                window.location = dapp_url
            } else {
                document.getElementById("feedback").innerHTML = response.error
            }
        }
    }
}

//
// Id the user is still not authenticated, display the login page again
//
document.getElementById("loader").style.display = 'none'
document.getElementById("feedback").innerHTML = ""
if (!getUser()) {
    displayLogin()
} else {

    document.getElementById('info').style.display = 'block'
    document.getElementById('info2').style.display = 'block'
    main()
}

var opEvent = new EventSource(`https://horizon-futurenet.stellar.org/accounts/${getPubkey}/operations?order=desc&cursor=now&liimt=100`)
opEvent.addEventListener('message', e => {
    let op = JSON.parse(e.data)
    if (op.transaction_successful && op.type == "invoke_host_function") {
        let params = op.parameters
        let cid = SorobanClient.xdr.ScVal.fromXDR(params[0].value, 'base64').obj().bin().toString('hex')
        let func = SorobanClient.xdr.ScVal.fromXDR(params[1].value, 'base64').sym().toString()
        console.log(func)
        if (cid == pixelWarContractId && func == "draw") {

            let x = SorobanClient.xdr.ScVal.fromXDR(params[2].value, 'base64').u32().toString()
            let y = SorobanClient.xdr.ScVal.fromXDR(params[3].value, 'base64').u32().toString()
            let color = SorobanClient.xdr.ScVal.fromXDR(params[4].value, 'base64').obj().bin().toString('hex')

            lastOperations.push({
                account: op.source_account,
                date: op.created_at,
                x: x,
                y: y,
                color: color
            })
            console.log(x + " " + y + " " + color)
            updateHistory()
        }
    }
})