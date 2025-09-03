import pygame
import sys
import random
import math

# Initialize pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 1000, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Mortal Kombat PyGame Edition")

# Colors
RED = (220, 20, 60)
BLUE = (30, 144, 255)
GREEN = (50, 205, 50)
YELLOW = (255, 215, 0)
PURPLE = (128, 0, 128)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
DARK_GRAY = (30, 30, 30)
LIGHT_GRAY = (100, 100, 100)
ORANGE = (255, 165, 0)
DARK_RED = (139, 0, 0)

# Fonts
title_font = pygame.font.SysFont("arial", 48, bold=True)
font_large = pygame.font.SysFont("arial", 32, bold=True)
font_medium = pygame.font.SysFont("arial", 24)
font_small = pygame.font.SysFont("arial", 18)

# Game states
MENU = 0
PLAYING = 1
GAME_OVER = 2
PAUSED = 3
game_state = MENU

# Clock for controlling frame rate
clock = pygame.time.Clock()

# Load images (placeholder code - in a real game you'd load actual images)
def create_surface(width, height, color):
    surf = pygame.Surface((width, height), pygame.SRCALPHA)
    pygame.draw.rect(surf, color, (0, 0, width, height))
    return surf

# Create placeholder images
scorpion_img = create_surface(60, 100, RED)
subzero_img = create_surface(60, 100, BLUE)
background_img = create_surface(WIDTH, HEIGHT, DARK_GRAY)
pygame.draw.rect(background_img, LIGHT_GRAY, (0, HEIGHT-50, WIDTH, 50))

# Blood effect class
class BloodEffect:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.particles = []
        for _ in range(15):
            self.particles.append({
                'x': x,
                'y': y,
                'dx': random.uniform(-3, 3),
                'dy': random.uniform(-3, 3),
                'size': random.randint(2, 5),
                'life': random.randint(20, 40)
            })
    
    def update(self):
        for particle in self.particles[:]:
            particle['x'] += particle['dx']
            particle['y'] += particle['dy']
            particle['life'] -= 1
            if particle['life'] <= 0:
                self.particles.remove(particle)
        return len(self.particles) > 0
    
    def draw(self, surface):
        for particle in self.particles:
            pygame.draw.circle(surface, RED, 
                              (int(particle['x']), int(particle['y'])), 
                              particle['size'])

# Fighter class
class Fighter:
    def __init__(self, x, y, width, height, color, controls, name):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.color = color
        self.vel = 8
        self.jump_vel = 20
        self.is_jumping = False
        self.jump_count = 10
        self.health = 100
        self.controls = controls
        self.name = name
        self.attacking = False
        self.attack_cooldown = 0
        self.attack_power = 10
        self.kicks = []
        self.special_cooldown = 0
        self.facing_right = True if x < WIDTH/2 else False
        self.hit_effect = False
        self.hit_timer = 0
        
    def draw(self, surface):
        # Draw character with hit effect
        color = self.color
        if self.hit_effect:
            color = YELLOW  # Flash yellow when hit
            
        pygame.draw.rect(surface, color, (self.x, self.y, self.width, self.height))
        
        # Draw face details
        eye_size = 10
        mouth_size = 15
        if self.facing_right:
            pygame.draw.rect(surface, BLACK, (self.x + self.width - 25, self.y + 15, eye_size, eye_size))
            pygame.draw.rect(surface, BLACK, (self.x + self.width - 25, self.y + 40, mouth_size, 5))
        else:
            pygame.draw.rect(surface, BLACK, (self.x + 15, self.y + 15, eye_size, eye_size))
            pygame.draw.rect(surface, BLACK, (self.x + 15, self.y + 40, mouth_size, 5))
            
        # Draw kicks
        for kick in self.kicks:
            pygame.draw.rect(surface, YELLOW, kick)
            
    def move(self, keys, opponent):
        if self.attacking:
            return
            
        if keys[self.controls["left"]] and self.x > 0:
            self.x -= self.vel
            self.facing_right = False
        if keys[self.controls["right"]] and self.x < WIDTH - self.width:
            self.x += self.vel
            self.facing_right = True
            
        # Prevent characters from overlapping
        if self.x + self.width > opponent.x and self.x < opponent.x + opponent.width:
            if self.x < opponent.x:
                self.x = opponent.x - self.width
            else:
                self.x = opponent.x + opponent.width
                
        # Jump mechanics
        if not self.is_jumping:
            if keys[self.controls["up"]] and self.y == HEIGHT - 150:
                self.is_jumping = True
        else:
            if self.jump_count >= -10:
                neg = 1
                if self.jump_count < 0:
                    neg = -1
                self.y -= (self.jump_count ** 2) * 0.5 * neg
                self.jump_count -= 1
            else:
                self.is_jumping = False
                self.jump_count = 10
                self.y = HEIGHT - 150
                
    def attack(self):
        if not self.attacking and self.attack_cooldown == 0:
            self.attacking = True
            self.attack_cooldown = 20
            
            # Create a kick rectangle based on which way the fighter is facing
            if self.facing_right:
                kick_rect = pygame.Rect(self.x + self.width, self.y + 20, 30, 20)
            else:
                kick_rect = pygame.Rect(self.x - 30, self.y + 20, 30, 20)
                
            self.kicks.append(kick_rect)
            
    def special_attack(self):
        if not self.attacking and self.special_cooldown == 0:
            self.attacking = True
            self.special_cooldown = 60
            
            # Create 3 kicks for special attack
            for i in range(3):
                if self.facing_right:
                    kick_rect = pygame.Rect(self.x + self.width + i*40, self.y + 20, 30, 20)
                else:
                    kick_rect = pygame.Rect(self.x - 30 - i*40, self.y + 20, 30, 20)
                    
                self.kicks.append(kick_rect)
                
    def update(self, opponent):
        # Update hit effect timer
        if self.hit_effect:
            self.hit_timer -= 1
            if self.hit_timer <= 0:
                self.hit_effect = False
                
        # Update attack cooldown
        if self.attack_cooldown > 0:
            self.attack_cooldown -= 1
            
        if self.special_cooldown > 0:
            self.special_cooldown -= 1
            
        # Update kicks
        kick_speed = 15
        for kick in self.kicks[:]:
            if self.facing_right:
                kick.x += kick_speed
            else:
                kick.x -= kick_speed
                
            # Check if kick hits opponent
            if kick.colliderect(pygame.Rect(opponent.x, opponent.y, opponent.width, opponent.height)):
                opponent.health -= self.attack_power
                opponent.hit_effect = True
                opponent.hit_timer = 5
                blood_effects.append(BloodEffect(kick.x, kick.y))
                self.kicks.remove(kick)
                
            # Remove kick if it goes off screen
            elif kick.x > WIDTH or kick.x < -30:
                self.kicks.remove(kick)
                
        # Reset attacking state
        if self.attacking and not self.kicks and self.attack_cooldown == 0:
            self.attacking = False

# Create fighters
player1 = Fighter(200, HEIGHT - 150, 60, 100, RED, 
                 {"left": pygame.K_a, "right": pygame.K_d, "up": pygame.K_w, "attack": pygame.K_f, "special": pygame.K_g},
                 "Scorpion")

player2 = Fighter(700, HEIGHT - 150, 60, 100, BLUE, 
                 {"left": pygame.K_LEFT, "right": pygame.K_RIGHT, "up": pygame.K_UP, "attack": pygame.K_k, "special": pygame.K_l},
                 "Sub-Zero")

# Background elements
class BackgroundElement:
    def __init__(self, x, y, size, color, speed):
        self.x = x
        self.y = y
        self.size = size
        self.color = color
        self.speed = speed
        
    def update(self):
        self.x -= self.speed
        if self.x < -self.size:
            self.x = WIDTH + random.randint(0, 100)
            self.y = random.randint(50, HEIGHT - 200)
            
    def draw(self, surface):
        pygame.draw.rect(surface, self.color, (self.x, self.y, self.size, self.size))

# Create background elements
background_elements = []
for _ in range(15):
    size = random.randint(5, 20)
    x = random.randint(0, WIDTH)
    y = random.randint(50, HEIGHT - 200)
    color = (random.randint(100, 200), random.randint(100, 200), random.randint(100, 200))
    speed = random.uniform(0.5, 2.5)
    background_elements.append(BackgroundElement(x, y, size, color, speed))

# Blood effects
blood_effects = []

# Round system
round_time = 99  # seconds
round_start_time = 0
current_round = 1
max_rounds = 3
player1_wins = 0
player2_wins = 0

# Main game loop
while True:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
            
        if event.type == pygame.KEYDOWN:
            # Menu controls
            if game_state == MENU:
                if event.key == pygame.K_SPACE:
                    game_state = PLAYING
                    # Reset game state
                    player1.health = 100
                    player2.health = 100
                    player1.x = 200
                    player2.x = 700
                    player1.kicks = []
                    player2.kicks = []
                    round_start_time = pygame.time.get_ticks()
                    
            # Pause controls
            elif game_state == PLAYING:
                if event.key == pygame.K_p:
                    game_state = PAUSED
                    
            # Game over controls
            elif game_state == GAME_OVER:
                if event.key == pygame.K_r:
                    game_state = PLAYING
                    # Reset game state
                    player1.health = 100
                    player2.health = 100
                    player1.x = 200
                    player2.x = 700
                    player1.kicks = []
                    player2.kicks = []
                    round_start_time = pygame.time.get_ticks()
                elif event.key == pygame.K_m:
                    game_state = MENU
                    current_round = 1
                    player1_wins = 0
                    player2_wins = 0
                    
            # Paused state controls
            elif game_state == PAUSED:
                if event.key == pygame.K_p:
                    game_state = PLAYING
                elif event.key == pygame.K_m:
                    game_state = MENU
                    current_round = 1
                    player1_wins = 0
                    player2_wins = 0
                    
            # Fighting controls
            if game_state == PLAYING:
                if event.key == player1.controls["attack"]:
                    player1.attack()
                if event.key == player1.controls["special"]:
                    player1.special_attack()
                if event.key == player2.controls["attack"]:
                    player2.attack()
                if event.key == player2.controls["special"]:
                    player2.special_attack()
    
    # Get key presses
    keys = pygame.key.get_pressed()
    
    # Update game state
    if game_state == PLAYING:
        player1.move(keys, player2)
        player2.move(keys, player1)
        
        player1.update(player2)
        player2.update(player1)
        
        # Update background elements
        for element in background_elements:
            element.update()
            
        # Update blood effects
        for effect in blood_effects[:]:
            if not effect.update():
                blood_effects.remove(effect)
        
        # Check for game over
        elapsed_time = (pygame.time.get_ticks() - round_start_time) // 1000
        remaining_time = max(0, round_time - elapsed_time)
        
        if player1.health <= 0 or player2.health <= 0 or remaining_time <= 0:
            # Determine round winner
            if player1.health > player2.health:
                player1_wins += 1
            elif player2.health > player1.health:
                player2_wins += 1
            # If it's a tie or time ran out, no one wins
            
            # Check if match is over
            if player1_wins >= 2 or player2_wins >= 2 or current_round >= max_rounds:
                game_state = GAME_OVER
            else:
                # Next round
                current_round += 1
                player1.health = 100
                player2.health = 100
                player1.x = 200
                player2.x = 700
                player1.kicks = []
                player2.kicks = []
                round_start_time = pygame.time.get_ticks()
    
    # Drawing
    screen.fill(DARK_GRAY)
    
    # Draw floor
    pygame.draw.rect(screen, LIGHT_GRAY, (0, HEIGHT - 50, WIDTH, 50))
    
    # Draw background elements
    for element in background_elements:
        element.draw(screen)
    
    # Draw health bars
    pygame.draw.rect(screen, DARK_RED, (50, 20, 300, 30))
    pygame.draw.rect(screen, DARK_RED, (WIDTH - 350, 20, 300, 30))
    
    pygame.draw.rect(screen, RED, (50, 20, player1.health * 3, 30))
    pygame.draw.rect(screen, BLUE, (WIDTH - 50 - player2.health * 3, 20, player2.health * 3, 30))
    
    # Draw round timer
    if game_state == PLAYING:
        timer_text = font_large.render(f"{remaining_time}", True, YELLOW)
        screen.blit(timer_text, (WIDTH/2 - timer_text.get_width()/2, 20))
    
    # Draw round info
    round_text = font_medium.render(f"Round {current_round}", True, WHITE)
    screen.blit(round_text, (WIDTH/2 - round_text.get_width()/2, 60))
    
    # Draw score
    score_text = font_medium.render(f"{player1_wins} - {player2_wins}", True, GREEN)
    screen.blit(score_text, (WIDTH/2 - score_text.get_width()/2, 90))
    
    # Draw player names
    p1_name_text = font_medium.render(player1.name, True, WHITE)
    p2_name_text = font_medium.render(player2.name, True, WHITE)
    screen.blit(p1_name_text, (50, 60))
    screen.blit(p2_name_text, (WIDTH - 50 - p2_name_text.get_width(), 60))
    
    # Draw blood effects
    for effect in blood_effects:
        effect.draw(screen)
    
    # Draw fighters
    player1.draw(screen)
    player2.draw(screen)
    
    # Draw UI based on game state
    if game_state == MENU:
        title_text = title_font.render("MORTAL KOMBAT", True, RED)
        screen.blit(title_text, (WIDTH/2 - title_text.get_width()/2, 100))
        
        subtitle_text = font_large.render("PyGame Edition", True, YELLOW)
        screen.blit(subtitle_text, (WIDTH/2 - subtitle_text.get_width()/2, 170))
        
        start_text = font_medium.render("Press SPACE to Start", True, GREEN)
        screen.blit(start_text, (WIDTH/2 - start_text.get_width()/2, 300))
        
        controls_text = font_small.render("Player 1: A/D to move, W to jump, F to attack, G for special", True, WHITE)
        screen.blit(controls_text, (WIDTH/2 - controls_text.get_width()/2, 400))
        
        controls_text2 = font_small.render("Player 2: Arrows to move, K to attack, L for special", True, WHITE)
        screen.blit(controls_text2, (WIDTH/2 - controls_text2.get_width()/2, 430))
        
        controls_text3 = font_small.render("Press P to pause during game", True, WHITE)
        screen.blit(controls_text3, (WIDTH/2 - controls_text3.get_width()/2, 460))
        
    elif game_state == GAME_OVER:
        if player1_wins > player2_wins:
            winner_text = font_large.render(f"{player1.name} WINS THE MATCH!", True, RED)
        else:
            winner_text = font_large.render(f"{player2.name} WINS THE MATCH!", True, BLUE)
            
        screen.blit(winner_text, (WIDTH/2 - winner_text.get_width()/2, 100))
        
        restart_text = font_medium.render("Press R to Restart", True, GREEN)
        screen.blit(restart_text, (WIDTH/2 - restart_text.get_width()/2, 200))
        
        menu_text = font_medium.render("Press M for Menu", True, YELLOW)
        screen.blit(menu_text, (WIDTH/2 - menu_text.get_width()/2, 250))
        
    elif game_state == PAUSED:
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        screen.blit(overlay, (0, 0))
        
        pause_text = font_large.render("GAME PAUSED", True, YELLOW)
        screen.blit(pause_text, (WIDTH/2 - pause_text.get_width()/2, 200))
        
        continue_text = font_medium.render("Press P to Continue", True, WHITE)
        screen.blit(continue_text, (WIDTH/2 - continue_text.get_width()/2, 250))
        
        menu_text = font_medium.render("Press M for Menu", True, WHITE)
        screen.blit(menu_text, (WIDTH/2 - menu_text.get_width()/2, 300))
    
    # Draw cooldown indicators
    if game_state == PLAYING:
        # Player 1 special cooldown
        if player1.special_cooldown > 0:
            pygame.draw.rect(screen, PURPLE, (50, HEIGHT - 80, 100, 20))
            pygame.draw.rect(screen, (100, 0, 100), (50, HEIGHT - 80, 100 * (player1.special_cooldown/60), 20))
            cooldown_text = font_small.render(f"{player1.special_cooldown//10 + 1}", True, WHITE)
            screen.blit(cooldown_text, (100, HEIGHT - 78))
        else:
            pygame.draw.rect(screen, PURPLE, (50, HEIGHT - 80, 100, 20))
            ready_text = font_small.render("SPECIAL READY", True, WHITE)
            screen.blit(ready_text, (55, HEIGHT - 78))
            
        # Player 2 special cooldown
        if player2.special_cooldown > 0:
            pygame.draw.rect(screen, PURPLE, (WIDTH - 150, HEIGHT - 80, 100, 20))
            pygame.draw.rect(screen, (100, 0, 100), (WIDTH - 150, HEIGHT - 80, 100 * (player2.special_cooldown/60), 20))
            cooldown_text = font_small.render(f"{player2.special_cooldown//10 + 1}", True, WHITE)
            screen.blit(cooldown_text, (WIDTH - 100, HEIGHT - 78))
        else:
            pygame.draw.rect(screen, PURPLE, (WIDTH - 150, HEIGHT - 80, 100, 20))
            ready_text = font_small.render("SPECIAL READY", True, WHITE)
            screen.blit(ready_text, (WIDTH - 145, HEIGHT - 78))
    
    # Update display
    pygame.display.flip()
    
    # Control frame rate
    clock.tick(60)
