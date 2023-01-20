use soroban_sdk::{Env, unwrap::UnwrapOptimized, panic_with_error, contracterror, contracttype, Symbol, symbol, Address, BytesN, Bytes};

#[contracttype]
pub struct PIXEL(pub u32, pub u32);

#[contracttype]
pub struct PLAYER(pub Address);

pub const GAME: Symbol = symbol!("GAME");
pub const ADMIN: Symbol = symbol!("ADMIN");

#[contracttype]
pub struct PixelWar{
    pub width: u32,
    pub height: u32,
    pub start: u64,
    pub end: u64,
    pub max: u32,
    pub data: Bytes
}

#[contracterror]
#[derive(Copy, Clone)]
pub enum PixelError {
    AlreadyInitialized = 0,
    NotYetInitialized = 1,
    Unauthorized = 3,
    NoMoreCredits = 4,
    OutOfBounds = 5,
    PixelWarClosed = 6,
    StillRunning = 7,
}

pub fn get_config(env: &Env) -> PixelWar{
    env.storage().get(GAME).unwrap_optimized().unwrap_optimized()
}

pub fn get_credits(env: &Env) -> u32{

    let credits: u32 = env.storage().get(PLAYER(env.invoker())).unwrap_optimized().unwrap_optimized();
    if credits == 0 {
        panic_with_error!(env, PixelError::NoMoreCredits);
    }

    credits
}

pub fn authorize(env: &Env, player: PLAYER, max: u32) {
    env.storage().set(player, max);
}

pub fn revoke(env: &Env, player: PLAYER) {
    env.storage().remove(player);
}

pub fn init_game(env: &Env, pixel_war: &PixelWar, admin: &Address) {
    env.storage().set(GAME, pixel_war);
    env.storage().set(ADMIN, admin);
}

pub fn finalize_game(env: &Env, pixel_war: &PixelWar) {
    env.storage().set(GAME, pixel_war);
    env.storage().remove(ADMIN);
}

pub fn set_pixel(env: &Env, pixel: PIXEL, color: &BytesN<3>) {
    env.storage().set(pixel, color);
}

pub fn debit(env: &Env, player: PLAYER, credit: u32) {
    env.storage().set(player, credit);
}