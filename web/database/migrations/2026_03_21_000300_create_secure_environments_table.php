<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secure_environments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('encrypted_variables');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secure_environments');
    }
};
