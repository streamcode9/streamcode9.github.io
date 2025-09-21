#include <stddef.h>
#include <emscripten/emscripten.h>

static const char GREETING[] = "Hello from WebAssembly!";

EMSCRIPTEN_KEEPALIVE
const char *get_greeting(void)
{
    return GREETING;
}

EMSCRIPTEN_KEEPALIVE
size_t get_greeting_length(void)
{
    return sizeof(GREETING) - 1;
}

int main(void)
{
    return 0;
}
