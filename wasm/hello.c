#include <emscripten/emscripten.h>

static float canvas_width = 640.0f;
static float canvas_height = 480.0f;
static float ball_x = 320.0f;
static float ball_y = 240.0f;
static float ball_radius = 16.0f;
static float velocity_x = 180.0f;
static float velocity_y = 140.0f;

static void clamp_ball_inside_canvas(void)
{
    if (ball_x < ball_radius) {
        ball_x = ball_radius;
    } else if (ball_x > canvas_width - ball_radius) {
        ball_x = canvas_width - ball_radius;
    }

    if (ball_y < ball_radius) {
        ball_y = ball_radius;
    } else if (ball_y > canvas_height - ball_radius) {
        ball_y = canvas_height - ball_radius;
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
    ball_x = canvas_width * 0.5f;
    ball_y = canvas_height * 0.5f;
    velocity_x = 180.0f;
    velocity_y = 140.0f;
    clamp_ball_inside_canvas();
}

EMSCRIPTEN_KEEPALIVE
void update(float delta_seconds)
{
    if (delta_seconds <= 0.0f) {
        return;
    }

    ball_x += velocity_x * delta_seconds;
    ball_y += velocity_y * delta_seconds;

    if (ball_x - ball_radius < 0.0f) {
        ball_x = ball_radius;
        velocity_x = -velocity_x;
    } else if (ball_x + ball_radius > canvas_width) {
        ball_x = canvas_width - ball_radius;
        velocity_x = -velocity_x;
    }

    if (ball_y - ball_radius < 0.0f) {
        ball_y = ball_radius;
        velocity_y = -velocity_y;
    } else if (ball_y + ball_radius > canvas_height) {
        ball_y = canvas_height - ball_radius;
        velocity_y = -velocity_y;
    }
}

EMSCRIPTEN_KEEPALIVE
float get_ball_x(void)
{
    return ball_x;
}

EMSCRIPTEN_KEEPALIVE
float get_ball_y(void)
{
    return ball_y;
}

EMSCRIPTEN_KEEPALIVE
float get_ball_radius(void)
{
    return ball_radius;
}
