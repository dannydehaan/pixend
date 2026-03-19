<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('collection_endpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('method');
            $table->string('route');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('cache')->nullable();
            $table->string('priority')->nullable();
            $table->string('access')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_endpoints');
    }
};
