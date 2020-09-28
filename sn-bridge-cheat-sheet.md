# Component Manager
Component Manager is the interface that your component uses to access data.

### new ComponentManager(permissions, delegate);
Creates a new component manager class with the given permissions. Calls delegate
when loaded. Permissions is an array of objects, not sure what values there are,
but I have seen the following before:
[  { name: "stream-context-item" }, ...  ]

## Methods
All methods can be seen defined [here](https://github.com/sn-extensions/extensions-manager/blob/159315b17422709f4fc15b2f4a364a023f0472f1/dist/dist.js#L3460).
Here are some useful ones:

### componentManager.setComponentDataValueForKey(key, value);
Save the key-value pair.

### componentManager.componentDataValueForKey("");
Takes the given key, returns an associated value.

### componentManager.streamContextItem(delegate)
I believe this calls delegate whenever the note has been updated externally or
is first loaded and is being "stream"-ed into the extension.

### componentManager.saveItemWithPresave(note)