#define WASM_EXPORT __attribute__((visibility("default")))

int memory[256];
int memPtr = 0;

WASM_EXPORT
void push(int x) {
  memory[memPtr] = x;
  memPtr = ++memPtr & 0xff;
}

int pop() {
  memPtr = --memPtr & 0xff;
  return memory[memPtr];
}

WASM_EXPORT
void add() {
  push(pop() + pop());
}

WASM_EXPORT
void subtract() {
  push(-pop() + pop());
}

WASM_EXPORT
void multiply() {
  push(pop() * pop());
}

WASM_EXPORT
void divide() {
  int x = pop();
  push(pop() / x);
}

WASM_EXPORT
void modulo() {
  int x = pop();
  push(pop() % x);
}

WASM_EXPORT
void bitwiseInvert() {
  push(~pop());
}

WASM_EXPORT
void shiftRight() {
  int x = pop();
  push(pop() >> x);
}

WASM_EXPORT
void shiftLeft() {
  int x = pop();
  push(pop() << x);
}

WASM_EXPORT
void bitwiseAnd() {
  push(pop() & pop());
}

WASM_EXPORT
void bitwiseOr() {
  push(pop() | pop());
}

WASM_EXPORT
void bitwiseXor() {
  push(pop() ^ pop());
}

WASM_EXPORT
void greaterThan() {
  push(pop() > pop() ? 0xffffffff : 0);
}

WASM_EXPORT
void lessThan() {
  push(pop() < pop() ? 0xffffffff : 0);
}

WASM_EXPORT
void equal() {
  push(pop() == pop() ? 0xffffffff : 0);
}

WASM_EXPORT
void drop() {
  pop();
}

WASM_EXPORT
void dup() {
  int x = pop();
  push(x);
  push(x);
}

WASM_EXPORT
void swap() {
  int x = pop();
  int y = pop();
  push(x);
  push(y);
}

WASM_EXPORT
void pick() {
  int x = pop();
  push(memory[(memPtr - x) & 0xff]);
}

WASM_EXPORT
void put() {
  int x = pop();
  memory[(memPtr - memory[(memPtr - 1) & 0xff] - 1) & 0xff] = x;
}

WASM_EXPORT
int popByte() {
  return pop() & 0xff;
}

WASM_EXPORT
int popUint32() {
  return pop();
}

WASM_EXPORT
float popFloat32() {
  return pop() / 2147483648.0 - 1.0;
}

WASM_EXPORT
float popFloat32Byte() {
  return (pop() & 0xff) / 128.0 - 1.0;
}

WASM_EXPORT
void reset() {
  for (int i = 0; i < 256; i++) {
    memory[i] = 0;
  }
  memPtr = 0;
}
