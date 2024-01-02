import sys

import pygame
from pygame import event


class Text:

    def __init__(self, window, font, message, x, y):
        self.window = window
        
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
        self.window.blit(self.text, self.textRect)

class Window():
    
    def __init__(self):
        
        # Need this at the start of a pygame file or nothing works. ¯\_(ツ)_/¯
        pygame.init()

        # Set up for the application window
        pygame.display.set_caption("Wahooey")
        self.window = pygame.display.set_mode((1200, 900))  # (x,y)
        self.window.fill((255, 255, 255))  # Sets app background to white

        # font object, you can change this pretty easily
        self.font = pygame.font.SysFont('bahnschrift', 16)
    
    def draw(self, baseTokens, mappedObjects):

        # DISPLAY TOKENS
        # top row ('objects')
        x = 0  # This will auto-update
        y = 60  # This you can set yourself for this program
        objects_to_map = {}
        for objIndex, obj in enumerate(mappedObjects):
            x += 10  # A bit of odd padding
            new_obj = Text(self.window, self.font, obj['content'], x, y)
            # Make sure we base the next x off the end of the last object's width
            x = new_obj.textRect.right
            new_obj.write()
            objects_to_map[objIndex] = new_obj

        # bottom row ('tokens')
        x = 0
        y = 150
        map_objects = {}
        for objIndex, obj in baseTokens.items():
            x += 10  # A bit of odd padding
            new_obj = Text(self.window, self.font, obj['eng'], x, y)
            # Make sure we base the next x off the end of the last object's width
            x = new_obj.textRect.right
            new_obj.write()
            x += 5
            # The divider
            pygame.draw.line(self.window, (0, 0, 0), (x, y), (x, y + self.font.get_height()))
            map_objects[objIndex] = new_obj

        # DISPLAY MAPPINGS
        for objIndex, obj in enumerate(mappedObjects):

            if (token := obj.get('token')):
                # Using font.get_height() to save you needing to edit this
                to_map_tuple = (
                    objects_to_map[objIndex].textRect.centerx,
                    objects_to_map[objIndex].textRect.centery + (0.5 * self.font.get_height())
                )
                map_tuple = (
                    map_objects[str(token)].textRect.centerx,
                    map_objects[str(token)].textRect.centery - (0.5 * self.font.get_height())
                )
                pygame.draw.line(self.window,
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


if (__name__ == "__main__"):
    window = Window()

    # GEN.1.1
    baseTokens = {
        '0': { 'eng': "In the beginning" },
        '1': { 'eng': "created" },
        '2': { 'eng': "God" },
        '3': { 'eng': "-" },
        '4': { 'eng': "the heavens" },
        '5': { 'eng': "and" },
        '6': { 'eng': "the earth" }
    }
    mappedObjects = [
        { 'content': "In", "token": "0" },
        { 'content': "the", "token": "0" },
        { 'content': "beginning", "token": "0" },
        { 'content': "God", "token": "2" },
        { 'content': "created", "token": "1" },
        { 'content': "the", "token": "4" },
        { 'content': "heavens", "token": "4" },
        { 'content': "and", "token": "5" },
        { 'content': "the", "token": "6" },
        { 'content': "earth", "token": "6" }
    ]

    window.draw(baseTokens, mappedObjects)
