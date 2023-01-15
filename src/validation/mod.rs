use soroban_sdk::{Address, panic_with_error, Env, unwrap::UnwrapOptimized};

use crate::storage::{GAME, ADMIN, PLAYER, PixelError, self};



pub fn is_init(env: &Env) -> bool {
    env.storage().has(GAME)
}

pub fn is_admin(env: &Env) -> bool {
    check_is_init(&env);

    let admin: Address = env.storage().get(ADMIN).unwrap_optimized().unwrap_optimized();

    admin == env.invoker()
}

pub fn check_is_admin(env: &Env) {
    if !is_admin(&env) {
        panic_with_error!(env, PixelError::Unauthorized);
    }
}

pub fn check_is_authorized(env: &Env) {
    if !env.storage().has(PLAYER(env.invoker())) {
        panic_with_error!(env, PixelError::Unauthorized);
    }
}

pub fn check_is_init(env: &Env) {
    if !is_init(&env) {
        panic_with_error!(env, PixelError::NotYetInitialized);
    }
}

pub fn check_is_not_init(env: &Env) {
    if is_init(&env) {
        panic_with_error!(env, PixelError::AlreadyInitialized);
    }
}

pub fn check_pixel_is_valid(env: &Env, x: u32, y: u32) {
    let config = storage::get_config(&env);
    if config.end < env.ledger().timestamp() {
        panic_with_error!(env, PixelError::PixelWarClosed);
    }

    if x >= config.width || y >= config.height {
        panic_with_error!(env, PixelError::OutOfBounds);
    }
}


