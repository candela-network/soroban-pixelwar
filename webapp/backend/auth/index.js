import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import SorobanClient from 'soroban-client'
import StellarSdk from 'stellar-sdk'
import config from './config.json' assert { type: 'json' }
import { request } from 'undici'

const app = express()
app.use(express.json())

const adapter = new JSONFile('db.json')
const db = new Low(adapter)


await db.read()
db.data ||= { accounts: [] }

const { accounts } = db.data
const HORIZON = new StellarSdk.Server("https://futurenet.candela.network")
const RPC = new SorobanClient.Server("https://futurenet.candela.network:443/soroban/rpc")


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
			.setTimeout(SorobanClient.TimeoutInfinite)
			.build();
	}

	return t;
}

function authorize(contractId, source, accountId, footprint) {
	let contract = new SorobanClient.Contract(contractId)
	let t = new SorobanClient.TransactionBuilder(source, {
		fee: '100',
		networkPassphrase: SorobanClient.Networks.FUTURENET,
	})
		.addOperation(
			contract.call(
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

	return decorateFootprint(t, footprint);
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}


app.get('/authenticate/', async (req, res) => {

	res.set({
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	})

	let code = req.query.code;
	let state = req.query.state;
	if (code && state) {
		try {
			const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: config.clientId,
					client_secret: config.clientSecret,
					code,
					grant_type: 'authorization_code',
					redirect_uri: config.redirect_url,
					scope: 'identify+guilds.members.read',
				}).toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			const oauthData = await tokenResponseData.body.json();

			// Check the user is part of the discord server
			const userResultData = await request(`https://discord.com/api/users/@me/guilds/${config.guild_id}/member`, {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});

			const userResult = await userResultData.body.json()
			if (userResult.user) {

				// Give some XLM to the user stellar account
				let pk = SorobanClient.StrKey.encodeEd25519PublicKey(Buffer.from(state, 'hex'))
				const fData = await request('https://friendbot-futurenet.stellar.org/?addr=' + pk);

				// Get the admin
				let signer = SorobanClient.Keypair.fromSecret(config.secret)

				// simulate
				let account = await RPC.getAccount(signer.publicKey());
				let source = new SorobanClient.Account(account.id, account.sequence)
				let t = authorize(config.contractId, source, Buffer.from(state, 'hex'))
				t.sign(signer)
				let sim = await RPC.simulateTransaction(t)

				// authorize
				account = await RPC.getAccount(signer.publicKey());
				source = new SorobanClient.Account(account.id, account.sequence)
				let t2 = authorize(config.contractId, source, Buffer.from(state, 'hex'), sim.footprint)
				t2.sign(signer)
				let { id } = await RPC.sendTransaction(t2)

				let status = "pending"
				while (status == "pending") {
					let response = await RPC.getTransactionStatus(id)
					status = response.status;
					switch (response.status) {

						case "success": {

							accounts.push({ id: userResult.user.id, pkey: pk })
							await db.write()

							res.send({ user: userResult.user })
							return;
						};
							break;
						case "error":
							console.log(response)
							res.send({ error: response.error })
							return;
						default:
					}
				}

			}

			// console.log(oauthData);
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error
			// tokenResponseData.statusCode will be 401
			console.error(error);
		}
	}

	// const post = posts.find((p) => p.id === req.params.id)
	res.send({ error: "Could not authenticate user" })
})


app.listen(3000, () => {
	console.log('listening on port 3000')
})