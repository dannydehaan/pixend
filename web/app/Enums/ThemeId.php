<?php

declare(strict_types=1);

namespace App\Enums;

enum ThemeId: string
{
    case PIXELS = 'pixels';
    case DRACULA = 'dracula';
    case MONOKAI = 'monokai';
    case NORD = 'nord';
    case SOLARIZED_DARK = 'solarized-dark';
    case MATRIX = 'matrix';
    case LIGHT = 'light';

    /**
     * Return the string values for every case.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $theme) => $theme->value, self::cases());
    }
}
