# soroban-pixelwar (project submitted to [hacka-soroban-athon](https://hacka-soroban-athon.devpost.com/))

## Project structure

- [src/](https://github.com/candela-network/soroban-pixelwar/tree/main/src) The soroban contract
- [webapp/](https://github.com/candela-network/soroban-pixelwar/tree/main/webapp) The web application
- [webapp/backend/auth/](https://github.com/candela-network/soroban-pixelwar/tree/main/webapp/backend/auth) The backend discord integration
- [webapp/backend/listener/](https://github.com/candela-network/soroban-pixelwar/tree/main/webapp/backend/listener) The soroban event listener that draws the picture
- [example/](https://github.com/candela-network/soroban-pixelwar/tree/main/example) An example to interact with the contract



## Inspiration

r/place on Reddit is a fun event and I thought it could be nice to bring it to Stellar

## What it does

It allows to set the color of a pixel on an image. 
Each interaction is recorded in the blockchain, one can replay the events to build the full picture.

It provides 
- the smart contract with basic authorisation and authentication, 
- the webapp (front and back end) 
- and an SDK to allow others build on top of the contract.

## Challenges we ran into

Calling the contract, with the right types from javascript was the main challenge.
Also, adding the footprint to the transaction gave me some good thinking moment. I finally came to this helper method which allows to use the same method call to build the XDR to `simulateTransaction` or `sendTransaction`.

Hopefully could help others too:

```javascript
// Add the footprint to the transaction
function decorateFootprint(t, footprint) {
    if (footprint) {
        let source = new SorobanClient.Account(t.source, `${parseInt(t.sequence) - 1}`);
        let op = SorobanClient.Operation.invokeHostFunction({
            function: t.operations[0].function,
            parameters: t.operations[0].parameters,
            footprint: SorobanClient.xdr.LedgerFootprint.fromXDR(footprint, 'base64'),
        })

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

// Example to call a contract method
function my_function(contractId, source, accountId, footprint) {
	let contract = new SorobanClient.Contract(contractId)
		let t = new SorobanClient.TransactionBuilder(source, {
		fee: '100',
		networkPassphrase: SorobanClient.Networks.FUTURENET,
	})
		.addOperation(
			contract.call(
				"my_function",
				SorobanClient.xdr.ScVal....
			)
		)
		.setTimeout(SorobanClient.TimeoutInfinite)
		.build();

	return decorateFootprint(t, footprint);
}
```

## Accomplishments

I wanted to add a more user-friendly way to connect to the Stellar blockchain and to be able to test the dApp without technical settings. The discord authentication that create a Stellar account while the end-user keeps its secret key is a nice addition to the project.

*Note: the key is not stored securely*

## What we learned

A lot of new things but the biggest step is related to the ScVal type building

## What's next for PixelWar

This smart contract should be deployed through a deployer contract to provide better experience. That would allow anyone to easily launch its own pixel war event.
