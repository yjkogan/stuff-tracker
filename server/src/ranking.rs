use std::f64::consts::PI;

const TAU: f64 = 0.5;
const GLICKO_SCALE: f64 = 173.7178;

#[derive(Debug, Clone, Copy)]
pub struct Rating {
    pub rating: f64,
    pub rd: f64,
    pub vol: f64,
}

impl Default for Rating {
    fn default() -> Self {
        Self {
            rating: 1500.0,
            rd: 350.0,
            vol: 0.06,
        }
    }
}

pub fn rating_to_score(rating: f64) -> f64 {
    // 0-100 score based on 1500 being 50.
    // 100 / (1 + e^(-0.005 * (rating - 1500)))
    // Formatted to 1 decimal place effectively by the logic, but here we return raw f64
    100.0 / (1.0 + (-0.005 * (rating - 1500.0)).exp())
}

// Convert from Glicko-2 scale to internal Glicko-2 scale
fn g2_scale(r: f64, rd: f64) -> (f64, f64) {
    let mu = (r - 1500.0) / GLICKO_SCALE;
    let phi = rd / GLICKO_SCALE;
    (mu, phi)
}

// Convert from internal to Glicko-2 scale
fn original_scale(mu: f64, phi: f64) -> (f64, f64) {
    let r = 1500.0 + (mu * GLICKO_SCALE);
    let rd = phi * GLICKO_SCALE;
    (r, rd)
}

fn g(phi: f64) -> f64 {
    1.0 / (1.0 + 3.0 * phi.powi(2) / PI.powi(2)).sqrt()
}

fn e(mu: f64, mu_j: f64, phi_j: f64) -> f64 {
    1.0 / (1.0 + (-g(phi_j) * (mu - mu_j)).exp())
}

fn f(x: f64, delta: f64, phi: f64, v: f64, a: f64) -> f64 {
    let ex = x.exp();
    let num1 = ex * (delta.powi(2) - phi.powi(2) - v - ex);
    let den1 = 2.0 * (phi.powi(2) + v + ex).powi(2);
    let term1 = num1 / den1;
    let term2 = (x - a) / TAU.powi(2);
    term1 - term2
}

// Updates ratings for a single match where winner beat loser
pub fn calculate_glicko_update(winner: Rating, loser: Rating) -> (Rating, Rating) {
    let (w_mu, w_phi) = g2_scale(winner.rating, winner.rd);
    let (l_mu, l_phi) = g2_scale(loser.rating, loser.rd);

    let (new_w_mu, new_w_phi, new_w_vol) = update_one(w_mu, w_phi, winner.vol, l_mu, l_phi, 1.0);
    let (new_l_mu, new_l_phi, new_l_vol) = update_one(l_mu, l_phi, loser.vol, w_mu, w_phi, 0.0);

    let (w_r, w_rd) = original_scale(new_w_mu, new_w_phi);
    let (l_r, l_rd) = original_scale(new_l_mu, new_l_phi);

    (
        Rating { rating: w_r, rd: w_rd, vol: new_w_vol },
        Rating { rating: l_r, rd: l_rd, vol: new_l_vol },
    )
}

fn update_one(mu: f64, phi: f64, sigma: f64, mu_j: f64, phi_j: f64, score: f64) -> (f64, f64, f64) {
    let g_phi_j = g(phi_j);
    let e_val = e(mu, mu_j, phi_j);
    
    let v = 1.0 / (g_phi_j.powi(2) * e_val * (1.0 - e_val));
    
    let delta = v * g_phi_j * (score - e_val);
    
    let a = sigma.ln().powi(2);
    
    // Iterative algorithm to find new sigma (volatility)
    let epsilon = 0.000001;
    let mut big_a = a;
    let mut big_b = if delta.powi(2) > (phi.powi(2) + v) {
        (delta.powi(2) - phi.powi(2) - v).ln()
    } else {
        let mut k = 1.0;
        while f(a - k * TAU, delta, phi, v, a) < 0.0 {
            k += 1.0;
        }
        a - k * TAU
    };
    
    let mut f_a = f(big_a, delta, phi, v, a);
    let mut f_b = f(big_b, delta, phi, v, a);
    
    while (big_b - big_a).abs() > epsilon {
        let big_c = big_a + (big_a - big_b) * f_a / (f_b - f_a);
        let f_c = f(big_c, delta, phi, v, a);
        
        if f_c * f_b < 0.0 {
            big_a = big_b;
            f_a = f_b;
        } else {
            f_a = f_a / 2.0;
        }
        big_b = big_c;
        f_b = f_c;
    }
    
    let new_sigma = (big_a / 2.0).exp();
    let phi_star = (phi.powi(2) + new_sigma.powi(2)).sqrt();
    
    let new_phi = 1.0 / (1.0 / phi_star.powi(2) + 1.0 / v).sqrt();
    let new_mu = mu + new_phi.powi(2) * g_phi_j * (score - e_val);
    
    (new_mu, new_phi, new_sigma)
}
