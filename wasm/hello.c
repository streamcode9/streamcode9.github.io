#include <emscripten/emscripten.h>
#include <stdint.h>

typedef struct BallState {
    float x;
    float y;
    float radius;
} BallState;

static float canvas_width = 640.0f;
static float canvas_height = 480.0f;
static BallState ball = {320.0f, 240.0f, 16.0f};
static float velocity_x = 180.0f;
static float velocity_y = 140.0f;

static void clamp_ball_inside_canvas(void)
{
    if (ball.x < ball.radius) {
        ball.x = ball.radius;
    } else {
        const float max_x = canvas_width - ball.radius;
        if (ball.x > max_x) {
            ball.x = max_x;
        }
    }

    if (ball.y < ball.radius) {
        ball.y = ball.radius;
    } else {
        const float max_y = canvas_height - ball.radius;
        if (ball.y > max_y) {
            ball.y = max_y;
        }
    }
}

static void simulate_ball(float delta_seconds)
{
    if (delta_seconds <= 0.0f) {
        return;
    }

    ball.x += velocity_x * delta_seconds;
    ball.y += velocity_y * delta_seconds;

    if (ball.x - ball.radius < 0.0f) {
        ball.x = ball.radius;
        velocity_x = -velocity_x;
    } else if (ball.x + ball.radius > canvas_width) {
        ball.x = canvas_width - ball.radius;
        velocity_x = -velocity_x;
    }

    if (ball.y - ball.radius < 0.0f) {
        ball.y = ball.radius;
        velocity_y = -velocity_y;
    } else if (ball.y + ball.radius > canvas_height) {
        ball.y = canvas_height - ball.radius;
        velocity_y = -velocity_y;
    }
}

EMSCRIPTEN_KEEPALIVE
void set_canvas_size(int width, int height)
{
    if (width > 0) {
        canvas_width = (float)width;
    }

    if (height > 0) {
        canvas_height = (float)height;
    }

    clamp_ball_inside_canvas();
}

EMSCRIPTEN_KEEPALIVE
void reset_ball(void)
{
    ball.x = canvas_width * 0.5f;
    ball.y = canvas_height * 0.5f;
    velocity_x = 180.0f;
    velocity_y = 140.0f;
    clamp_ball_inside_canvas();
}

EMSCRIPTEN_KEEPALIVE
void update(float delta_seconds)
{
    simulate_ball(delta_seconds);
}

EMSCRIPTEN_KEEPALIVE
uintptr_t update_and_get_state(float delta_seconds)
{
    simulate_ball(delta_seconds);
    return (uintptr_t)&ball;
}

EMSCRIPTEN_KEEPALIVE
uintptr_t get_ball_state_ptr(void)
{
    return (uintptr_t)&ball;
}

EMSCRIPTEN_KEEPALIVE
float get_ball_x(void)
{
    return ball.x;
}

EMSCRIPTEN_KEEPALIVE
float get_ball_y(void)
{
    return ball.y;
}

EMSCRIPTEN_KEEPALIVE
float get_ball_radius(void)
{
    return ball.radius;
}
