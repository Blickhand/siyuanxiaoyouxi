// World Dimensions
export const LANE_WIDTH = 2.0;
export const LANE_COUNT = 3; // -1 (Left), 0 (Center), 1 (Right)

// Player Physics / Animation Durations (seconds)
export const LANE_CHANGE_DURATION = 0.2;
export const JUMP_DURATION = 0.6;
export const JUMP_HEIGHT = 1.7; // Reduced from 2.5 to ensure player cannot jump over high obstacles
export const ROLL_DURATION = 0.6;

// Game Settings
export const GAME_SPEED_START = 15.0;
export const GAME_SPEED_MAX = 40.0; // Cap for speed
export const SPAWN_DISTANCE = 60; // How far ahead to spawn
export const OBSTACLE_INTERVAL = 15; // Starting distance between obstacles
export const OBSTACLE_INTERVAL_MIN = 8; // Minimum distance at max speed
export const GROUND_SEGMENT_LENGTH = 50;
export const GROUND_SEGMENT_COUNT = 3;

// Colors (Hex)
export const COLOR_SKY = 0x0f172a; // Deep Blue (Slate 900)
export const COLOR_GROUND_TRACK = 0xef4444; // Red (Red 500)
export const COLOR_GROUND_SNOW = 0xf8fafc; // White/Snow (Slate 50)
export const COLOR_PLAYER = 0x22c55e; // Green (Green 500)
export const COLOR_OBSTACLE = 0xdc2626; // Darker Red
export const COLOR_COIN = 0xfacc15; // Yellow
export const COLOR_FOG = 0x0f172a; // Matches Sky

// Camera
export const CAMERA_OFFSET_Z = 6;
export const CAMERA_OFFSET_Y = 4;
export const CAMERA_FOV = 60;