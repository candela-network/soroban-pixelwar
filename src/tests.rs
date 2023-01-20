extern crate std;
use std::{println, time::UNIX_EPOCH};

use crate::{PixelWarContract, PixelWarContractClient};
use soroban_sdk::{
    bytesn,
    testutils::{self, Accounts, Ledger},
    Address, Env, bytes,
};

#[test]
fn test_draw() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);

    env.ledger().set(testutils::LedgerInfo {
        protocol_version: 0,
        sequence_number: 0,
        timestamp: std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time flies")
            .as_secs(),
        network_passphrase: [0u8].to_vec(),
        base_reserve: 0,
    });
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));
    pwcontract
        .with_source_account(&player1)
        .draw(&5, &3, &bytesn!(&env, [128, 128, 128]));
}

#[test]
#[should_panic(expected = "Status(ContractError(0))")]
fn already_initialized() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &60, &10);
}

#[test]
#[should_panic(expected = "Status(ContractError(3))")]
fn unauthorized() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&player1)
        .draw(&5, &3, &bytesn!(&env, [128, 128, 128]));
}

#[test]
#[should_panic(expected = "Status(ContractError(1))")]
fn auth_not_init() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);

    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));
}

#[test]
#[should_panic(expected = "Status(ContractError(3))")]
fn auth_not_admin() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&player1)
        .authorize(&Address::Account(player1.clone()));
}

#[test]
#[should_panic(expected = "Status(ContractError(4))")]
fn exhaust_pixels() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    for _ in 0..10 {
        pwcontract
            .with_source_account(&player1)
            .draw(&5, &3, &bytesn!(&env, [128, 128, 128]));
    }

    pwcontract
        .with_source_account(&player1)
        .draw(&5, &3, &bytesn!(&env, [128, 128, 128]));
}

#[test]
#[should_panic(expected = "Status(ContractError(5))")]
fn outofbound_1() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    pwcontract
        .with_source_account(&player1)
        .draw(&10, &3, &bytesn!(&env, [128, 128, 128]));
}

#[test]
#[should_panic(expected = "Status(ContractError(5))")]
fn outofbound_2() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    pwcontract
        .with_source_account(&player1)
        .draw(&2, &10, &bytesn!(&env, [128, 128, 128]));
}

#[test]
#[should_panic(expected = "Status(ContractError(6))")]
fn test_closed() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);

    env.ledger().set(testutils::LedgerInfo {
        protocol_version: 0,
        sequence_number: 0,
        timestamp: std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time flies")
            .as_secs(),
        network_passphrase: [0u8].to_vec(),
        base_reserve: 0,
    });
    let end = env.ledger().timestamp() - 1;

    println!("{}", env.ledger().timestamp());

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    pwcontract
        .with_source_account(&player1)
        .draw(&2, &8, &bytesn!(&env, [128, 128, 128]));
}

#[test]
fn test_finalize() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);

    env.ledger().set(testutils::LedgerInfo {
        protocol_version: 0,
        sequence_number: 0,
        timestamp: std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time flies")
            .as_secs(),
        network_passphrase: [0u8].to_vec(),
        base_reserve: 0,
    });
    let end = env.ledger().timestamp() - 1;

    println!("{}", env.ledger().timestamp());

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    pwcontract
        .with_source_account(&admin)
        .finalize(&bytes!(&env, 0xffffff));


}

#[test]
fn borders() {
    let env = Env::default();

    let admin = env.accounts().generate_and_create();
    let player1 = env.accounts().generate_and_create();

    let contract_id = env.register_contract(None, PixelWarContract);
    let pwcontract = PixelWarContractClient::new(&env, &contract_id);
    let end = env.ledger().timestamp() + 60;

    pwcontract
        .with_source_account(&admin)
        .init(&10, &10, &end.into(), &10);
    pwcontract
        .with_source_account(&admin)
        .authorize(&Address::Account(player1.clone()));

    pwcontract
        .with_source_account(&player1)
        .draw(&0, &0, &bytesn!(&env, [128, 128, 128]));
    pwcontract
        .with_source_account(&player1)
        .draw(&9, &9, &bytesn!(&env, [128, 128, 128]));
    pwcontract
        .with_source_account(&player1)
        .draw(&0, &9, &bytesn!(&env, [128, 128, 128]));
    pwcontract
        .with_source_account(&player1)
        .draw(&9, &0, &bytesn!(&env, [128, 128, 128]));

    
}
