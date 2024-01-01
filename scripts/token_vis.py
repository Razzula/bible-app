import sys

import pygame
from pygame import event

# Need this at the start of a pygame file or nothing works. ¯\_(ツ)_/¯
pygame.init()

# Set up for the application window
pygame.display.set_caption("Wahooey")
WINDOW = pygame.display.set_mode((1200, 900))  # (x,y)
WINDOW.fill((255, 255, 255))  # Sets app background to white

# font object, you can change this pretty easily
font = pygame.font.SysFont('bahnschrift', 16)

# region JSON

map_tokens = {
    "0": {
        "phrase": "In the beginning"
    },
    "1": {
        "phrase": "created"
    },
    "2": {
        "phrase": "God"
    },
    "3": {
        "phrase": "-"
    },
    "4": {
        "phrase": "the heavens"
    },
    "5": {
        "phrase": "and"
    },
    "6": {
        "phrase": "the earth"
    }
}

tokens_to_map = {
    "0": {
        "content": "In",
        "token": "0"
    },
    "1": {
        "content": "the",
        "token": "0"
    },
    "2": {
        "content": "beginning",
        "token": "0"
    },
    "3": {
        "content": "God",
        "token": "2"
    },
    "4": {
        "content": "created",
        "token": "1"
    },
    "5": {
        "content": "the",
        "token": "4"
    },
    "6": {
        "content": "heavens",
        "token": "4"
    },
    "7": {
        "content": "and",
        "token": "5"
    },
    "8": {
        "content": "the",
        "token": "6"
    },
    "9": {
        "content": "earth",
        "token": "6"
    }
}


# endregion


class Text:

    def __init__(self, message, x, y):
        self.message = message
        self.x = x
        self.y = y
        self.text = font.render(self.message, True, (0, 0, 0), None)
        self.textRect = self.text.get_rect()  # Get the box the text is in
        self.textRect.left = self.x
        self.textRect.top = self.y

    def write(self):
        # Sets text object
        # Parameters are the text, enabling anti-aliasing, text colour, and background colour
        # Now add to the screen!
        WINDOW.blit(self.text, self.textRect)


# each object in the JSON objects needs a Text object so let's create some heinous thing to do that
x = 0  # This will auto-update
y = 60  # This you can set yourself for this program
objects_to_map = {}
map_objects = {}
for obj in tokens_to_map.items():
    x += 10  # A bit of odd padding
    new_obj = Text(obj[1]['content'], x, y)
    # Make sure we base the next x off the end of the last object's width
    x = new_obj.textRect.right
    new_obj.write()
    objects_to_map[obj[0]] = new_obj

x = 0
y = 150
for obj in map_tokens.items():
    x += 10  # A bit of odd padding
    new_obj = Text(obj[1]['phrase'], x, y)
    # Make sure we base the next x off the end of the last object's width
    x = new_obj.textRect.right
    new_obj.write()
    x += 5
    # The divider
    pygame.draw.line(WINDOW, (0, 0, 0), (x, y), (x, y + font.get_height()))
    map_objects[obj[0]] = new_obj

# With the tokens displayed, it's now time to map them. What fun!
for obj in tokens_to_map.items():
    # Indexer baby
    token = obj[1]['token']
    # Using font.get_height() to save you needing to edit this
    to_map_tuple = (
        objects_to_map[obj[0]].textRect.centerx,
        objects_to_map[obj[0]].textRect.centery + (0.5 * font.get_height())
    )
    map_tuple = (
        map_objects[token].textRect.centerx,
        map_objects[token].textRect.centery - (0.5 * font.get_height())
    )
    pygame.draw.line(WINDOW,
                     (255, 0, 0),
                     to_map_tuple,  # start_pos
                     map_tuple  # end_pos
                     )

pygame.display.update()
while True:

    # This means you can actually quit the application
    # Kinda useful-ish
    for e in event.get():
        if e.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
