<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('counselors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('license_number');
            $table->string('specialization')->default('Marriage Counseling');
            $table->integer('years_experience');
            $table->text('education');
            $table->text('approach')->nullable();
            $table->decimal('hourly_rate', 8, 2);
            $table->json('available_days')->nullable(); // ['monday', 'tuesday', etc.]
            $table->time('available_from')->default('09:00:00');
            $table->time('available_to')->default('17:00:00');
            $table->string('timezone')->default('UTC');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_available')->default(true);
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('total_sessions')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('counselors');
    }
};
