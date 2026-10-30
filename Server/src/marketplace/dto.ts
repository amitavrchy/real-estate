import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsByteLength,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  InquiryStatus,
  ListingStatus,
  ListingType,
  PropertyType,
} from '@prisma/client';

export class RegisterDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @Length(10, 72) @IsByteLength(0, 72) password: string;
  @IsString() @Length(2, 100) name: string;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() @Length(1, 72) @IsByteLength(0, 72) password: string;
}
export class SearchDto {
  @IsOptional() @IsEnum({ yes: 'true', no: 'false' }) exclusive?: string;
  @IsOptional() @IsString() @MaxLength(150) q?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(ListingType) type?: ListingType;
  @IsOptional() @IsEnum(ListingStatus) status?: ListingStatus;
  @IsOptional() @IsEnum(PropertyType) propertyType?: PropertyType;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) beds?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) baths?: number;
  @IsOptional() @IsString() amenities?: string;
  @IsOptional() @IsString() bbox?: string;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 12;
}
export class PropertyDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  mediaUrls?: string[];
  @IsString() @Length(3, 150) title: string;
  @IsString() @Length(20, 15000) description: string;
  @IsEnum(ListingStatus) status: ListingStatus;
  @IsEnum(ListingType) listingType: ListingType;
  @IsEnum(PropertyType) propertyType: PropertyType;
  @Type(() => Number) @IsNumber() @Min(0) @Max(999999999999) price: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) beds?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  baths?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sqft?: number;
  @IsString() @Length(3, 200) addressLine1: string;
  @IsString() @Length(2, 100) city: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postalCode?: string;
  @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat: number;
  @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng: number;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsBoolean() isPrivateExclusive?: boolean;
  @IsOptional() @IsString() neighborhoodId?: string;
}
export class UpdatePropertyDto extends PartialType(PropertyDto) {}
export class MediaDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }) url: string;
  @IsOptional() @IsString() @MaxLength(200) alt?: string;
  @IsOptional()
  @IsEnum({ image: 'image', floorplan: 'floorplan', video: 'video' })
  kind?: string;
}
export class InquiryDto {
  @IsString() propertyId: string;
  @IsString() @Length(2, 100) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsString() @Length(10, 5000) message: string;
}
export class InquiryUpdateDto {
  @IsEnum(InquiryStatus) status: InquiryStatus;
}
export class CollectionDto {
  @IsString() @Length(1, 100) name: string;
}
export class ItemDto {
  @IsString() propertyId: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
  @IsOptional() @IsInt() @Min(0) rank?: number;
}
export class FavoriteDto {
  @IsString() propertyId: string;
}
export class SavedSearchDto {
  @IsString() @Length(1, 100) name: string;
  @IsObject() filters: Record<string, unknown>;
}
export class PostDto {
  @IsString() @Length(3, 200) title: string;
  @IsString() @Length(10, 500) excerpt: string;
  @IsString() @MinLength(20) body: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  coverImage?: string;
}
export class UpdatePostDto extends PartialType(PostDto) {}
export class LeadDto {
  @IsString() @Length(2, 100) name: string;
  @IsEmail() email: string;
  @IsString() @Length(5, 300) address: string;
  @Type(() => Number) @IsInt() @Min(100) @Max(100000) sqft: number;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
}
export class NewsletterDto {
  @IsEmail() email: string;
}
export class ReviewDto {
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @Length(10, 2000) body: string;
}
