# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ
"""Visualiser for token mapping"""
from os import environ
environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'  # Hide pygame welcome message
import pygame
from pygame import event


class Text:
    """Class for text objects"""

    def __init__(self, window, font, message, x, y, colour=(0, 0, 0)):
        self.window = window

        self.message = message
        self.x = x
        self.y = y
        self.text = font.render(self.message, True, colour, None)
        self.textRect = self.text.get_rect()  # Get the box the text is in
        self.textRect.left = self.x
        self.textRect.top = self.y

    def write(self):
        """Write the text to the screen"""
        # Sets text object
        # Parameters are the text, enabling anti-aliasing, text colour, and background colour
        # Now add to the screen!
        self.window.blit(self.text, self.textRect)

class Window():
    """Class for the token mapping visualiser window"""

    def __init__(self):

        # Need this at the start of a pygame file or nothing works. ¯\_(ツ)_/¯
        pygame.init()

        # Set up for the application window
        pygame.display.set_caption('Token Mapping Visualiser')
        self.windowBehind = pygame.display.set_mode((1920, 140))
        self.window = self.windowBehind.copy()
        self.window.fill((255, 255, 255))  # Sets app background to white

        # font object, you can change this pretty easily
        self.font = pygame.font.SysFont('bahnschrift', 16)

    def draw(self, baseTokens, mappedObjects, title=None):
        """Draw the token mapping visualisation"""

        # CLEAN INPUT
        mappedObjects = [obj for obj in mappedObjects if obj.get('type', None) != 'note']

        # DISPLAY TITLE
        if (title):
            pygame.display.set_caption(title)

        # DISPLAY TOKENS
        # top row ('objects')
        x = 0  # This will auto-update
        y = 10  # This you can set yourself for this program
        objects_to_map = {}
        for objIndex, obj in enumerate(mappedObjects):

            x += 10  # A bit of odd padding
            colour = (0, 0, 0) if (obj.get('token', None) is not None) else (255, 0, 0)  # if it's unmapped, make it red

            # it
            if (tokenFormat := obj.get('type', None)):
                if ('it' in tokenFormat):
                    obj['content'] = f'[{obj["content"]}]'
                    colour = (182, 182, 182)

            new_obj = Text(self.window, self.font, obj['content'], x, y, colour)
            new_obj.write()
            objects_to_map[objIndex] = new_obj

            # Make sure we base the next x off the end of the last object's width
            x = new_obj.textRect.right
        endWidth = new_obj.textRect.right

        # bottom row ('tokens')
        x = 0
        y = 100
        map_objects = {}
        for objIndex, obj in baseTokens.items():

            x += 10  # A bit of odd padding
            colour = (0, 0, 0) if self.isMapped(objIndex, mappedObjects) else (182, 182, 182) # if it's unmapped, make it gray

            new_obj = Text(self.window, self.font, obj['eng'], x, y, colour)
            new_obj.write()
            map_objects[objIndex] = new_obj

            # Make sure we base the next x off the end of the last object's width
            x = new_obj.textRect.right + 5

            if (int(objIndex) + 1 < len(baseTokens)):
                # The divider
                pygame.draw.line(self.window, (0, 0, 0), (x, y), (x, y + self.font.get_height()))
        endWidth = max(endWidth, new_obj.textRect.right)

        # DISPLAY MAPPINGS
        for objIndex, obj in enumerate(mappedObjects):

            if ((token := obj.get('token', None)) is not None):
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

        # RESIZE WINDOW
        pygame.display.set_mode((endWidth + 20, 140))
        self.windowBehind.blit(self.window, (0, 0))
        pygame.display.update()

        # MAIN LOOP
        while True:
            for e in event.get():
                if e.type == pygame.QUIT:
                    pygame.quit()
                    # sys.exit()
                    return

    def isMapped(self, token, mappedObjects):
        """Check if a token is mapped to any objects"""
        return any((str(mapping.get('token')) == str(token)) for mapping in mappedObjects)


if (__name__ == "__main__"):

    def main():
        """Main function for testing the visualiser"""
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

        window.draw(baseTokens, mappedObjects, title="GEN.1.1")

    main()
