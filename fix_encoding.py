#!/usr/bin/env python3
import re

# Read the file
with open('/Users/duesselc/Documents/Spark/nano-fab-game/src/App.jsx', 'r') as f:
    content = f.read()

# Fix the unicode escapes
content = content.replace('\\u003c', '<')
content = content.replace('\\u003e', '>')
content = content.replace('\\u0026', '&')

# Fix specific malformed tags I noticed
content = content.replace('This is a nano-fabrication simulator, where you\'ll get to build the devices that enable our digital world, using real processing steps.</p>', 
                         '<p>This is a nano-fabrication simulator, where you\'ll get to build the devices that enable our digital world, using real processing steps.</p>')

content = content.replace('Let\'s start by exploring the basic building blocks...', 
                         '<p>Let\'s start by exploring the basic building blocks...</p>')

# Write the fixed content back
with open('/Users/duesselc/Documents/Spark/nano-fab-game/src/App.jsx', 'w') as f:
    f.write(content)

print("Fixed HTML encoding issues in App.jsx")
