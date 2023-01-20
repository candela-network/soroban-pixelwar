#![no_std]

use soroban_sdk::{Address, contractimpl, Env, BytesN, Bytes, bytes, panic_with_error, symbol};
use storage::{PixelWar, PLAYER, PIXEL};


struct PixelWarContract;
#[contractimpl]
impl PixelWarContract {

    /// Create the game and set the invoker as admin
    /// The canvas is width x height and will be running until now + duration in seconds.
    /// Each player has a capacity of max pixels to draw.
    pub fn init(env: Env, width: u32, height: u32, end: u64, max: u32) -> (PixelWar, Address) {
        validation::check_is_not_init(&env);

        let pw = PixelWar {
            width: width,
            height: height,
            start: env.ledger().timestamp(),
            end: end,
            max: max,
            data: bytes!(&env, 0x0)
        };
        storage::init_game(&env, &pw, &env.invoker());

        (pw, env.invoker())
    }

    /// Authorize addr to draw
    pub fn authorize(env:Env, addr: Address) -> (PLAYER, u32) {
        validation::check_is_admin(&env);

        let config = storage::get_config(&env);
        storage::authorize(&env, PLAYER(addr.clone()), config.max);

        (PLAYER(addr), config.max)
    }

    /// Revoke addr, the player cannot draw anymore
    pub fn revoke(env: Env, addr: Address) {
        validation::check_is_admin(&env);
        storage::revoke(&env, PLAYER(addr));
    }

    /// Draw a pixel at (x, y) with color
    pub fn draw(env: Env, x: u32, y: u32, color: BytesN<3>) {
        validation::check_is_init(&env);
        validation::check_is_authorized(&env);
        validation::check_pixel_is_valid(&env, x, y);

        let credits = storage::get_credits(&env);
        storage::set_pixel(&env, PIXEL(x, y), &color);
        storage::debit(&env, PLAYER(env.invoker()), credits - 1);

        env.events().publish((symbol!("PIXEL"), symbol!("COLOR")), (PIXEL(x, y), color));
    }

    /// Make the contract immutable and upload the image data
    pub fn finalize(env: Env, data: Bytes) -> PixelWar {
        validation::check_is_admin(&env);

        let mut config = storage::get_config(&env);
        if env.ledger().timestamp() < config.end {
            panic_with_error!(&env, storage::PixelError::StillRunning);
        }

        config.data = data;
        storage::finalize_game(&env, &config);

        config
    }


}

mod validation;
mod storage;

#[cfg(test)]
mod tests;