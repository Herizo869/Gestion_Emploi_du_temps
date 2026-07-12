using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Emit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSupabaseAuthUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupabaseAuthUserId",
                table: "Enseignants",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Enseignants_SupabaseAuthUserId",
                table: "Enseignants",
                column: "SupabaseAuthUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Enseignants_SupabaseAuthUserId",
                table: "Enseignants");

            migrationBuilder.DropColumn(
                name: "SupabaseAuthUserId",
                table: "Enseignants");
        }
    }
}
