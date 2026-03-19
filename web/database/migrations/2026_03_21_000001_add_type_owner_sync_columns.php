<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            if (! Schema::hasColumn('workspaces', 'type')) {
                $table->string('type')->default('local')->after('slug');
            }
            if (! Schema::hasColumn('workspaces', 'owner_id')) {
                $table->foreignId('owner_id')->nullable()->after('type')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('workspaces', 'sync_enabled')) {
                $table->boolean('sync_enabled')->default(false)->after('organization_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            if (Schema::hasColumn('workspaces', 'sync_enabled')) {
                $table->dropColumn('sync_enabled');
            }
            if (Schema::hasColumn('workspaces', 'owner_id')) {
                $table->dropConstrainedForeignId('owner_id');
            }
            if (Schema::hasColumn('workspaces', 'type')) {
                $table->dropColumn('type');
            }
        });
    }
};
