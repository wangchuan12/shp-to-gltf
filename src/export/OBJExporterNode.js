import {
	Color,
	Matrix3,
	Vector2,
	Vector3
} from 'three';

import * as fs from 'fs'
class OBJExporterNode {

    /**
     * 
     * @param {fs.WriteStream} stream 
     */
    setWriteStream(stream){
        this.stream = stream
    }

	parse( object ) {
		let output = '';
		let indexVertex = 0;
		let indexVertexUvs = 0;
		let indexNormals = 0;

		const vertex = new Vector3();
		const color = new Color();
		const normal = new Vector3();
		const uv = new Vector2();

		const face = [];

		const max = 300 * 1024 * 1024
		// const buffer = new Uint8Array(max)
		
		let offset = 0
		const textEncoder = new TextEncoder()
		let buffer = []
		/**
		 * 
		 * @param {Uint8Array} data 
		 */
		const isWrite = (data)=>{
			// if (data.length + offset > max) {
			// 	this.stream.write(buffer)
			// 	offset = 0
			// }

			// buffer.set(data , offset)
			// offset += data.length
			data.forEach((va)=>{
				buffer.push(va)
			})
		}

		const parseMesh = ( mesh )=> {

			let nbVertex = 0;
			let nbNormals = 0;
			let nbVertexUvs = 0;

			const geometry = mesh.geometry;

			const normalMatrixWorld = new Matrix3();

			// shortcuts
			const vertices = geometry.getAttribute( 'position' );
			const normals = geometry.getAttribute( 'normal' );
			const uvs = geometry.getAttribute( 'uv' );
			const indices = geometry.getIndex();

            // output += 'o ' + mesh.name + '\n';
			// buffer.push(textEncoder.encode('o ' + mesh.name + '\n'))

			isWrite(textEncoder.encode('o ' + mesh.name + '\n'))
			// name of the mesh material
			if ( mesh.material && mesh.material.name ) {

                // if (this.stream) {
                //     this.stream.write('usemtl ' + mesh.material.name + '\n')
                // } else {
                //     output += 'usemtl ' + mesh.material.name + '\n';
                // }
				// output += 'usemtl ' + mesh.material.name + '\n';
				// buffer.push(textEncoder.encode('usemtl ' + mesh.material.name + '\n'))
				isWrite(textEncoder.encode('usemtl ' + mesh.material.name + '\n'))
			}

			// vertices

			if ( vertices !== undefined ) {

				for ( let i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

					vertex.fromBufferAttribute( vertices, i );

					// transform the vertex to world space
					vertex.applyMatrix4( mesh.matrixWorld );

                    // if (this.stream) {
                    //     this.stream.write( 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n')
                    // } 
					// transform the vertex to export format
					// output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';
					// output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';
					// buffer.push(textEncoder.encode('v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n'))
					isWrite(textEncoder.encode('v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n'))
				}

			}

			// uvs

			if ( uvs !== undefined ) {

				for ( let i = 0, l = uvs.count; i < l; i ++, nbVertexUvs ++ ) {

					uv.fromBufferAttribute( uvs, i );

                    // if (this.stream) {
                    //     this.stream.write('vt ' + uv.x + ' ' + uv.y + '\n')
                    // }
					// transform the uv to export format
					// output += 'vt ' + uv.x + ' ' + uv.y + '\n';
					// buffer.push(textEncoder.encode('vt ' + uv.x + ' ' + uv.y + '\n'))
					isWrite(textEncoder.encode('vt ' + uv.x + ' ' + uv.y + '\n'))

				}

			}

			// normals

			if ( normals !== undefined ) {

				normalMatrixWorld.getNormalMatrix( mesh.matrixWorld );

				for ( let i = 0, l = normals.count; i < l; i ++, nbNormals ++ ) {

					normal.fromBufferAttribute( normals, i );

					// transform the normal to world space
					normal.applyMatrix3( normalMatrixWorld ).normalize();

                    // if (this.stream) {
                    //     this.stream.write('vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n')
                    // }
					// transform the normal to export format
					// buffer.push(textEncoder.encode('vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n'))
					// output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';
					 isWrite(textEncoder.encode('vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n'))

				}

			}

			// faces

			if ( indices !== null ) {

				for ( let i = 0, l = indices.count; i < l; i += 3 ) {

					for ( let m = 0; m < 3; m ++ ) {

						const j = indices.getX( i + m ) + 1;

						face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

					}
                    // if (this.stream) {
                    //     this.stream.write('f ' + face.join( ' ' ) + '\n')
                    // }
					// transform the face to export format
					// buffer.push(textEncoder.encode('f ' + face.join( ' ' ) + '\n'))
					 // output += 'f ' + face.join( ' ' ) + '\n';
					 isWrite(textEncoder.encode('f ' + face.join( ' ' ) + '\n'))

				}

			} else {

				for ( let i = 0, l = vertices.count; i < l; i += 3 ) {

					for ( let m = 0; m < 3; m ++ ) {

						const j = i + m + 1;

						face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

					}
                    // if (this.stream) {
                    //     this.stream.write('f ' + face.join( ' ' ) + '\n')
                    // }
					// transform the face to export format
					// buffer.push(textEncoder.encode('f ' + face.join( ' ' ) + '\n'))
					// output += 'f ' + face.join( ' ' ) + '\n';
					isWrite(textEncoder.encode('f ' + face.join( ' ' ) + '\n'))

				}

			}

			// update index
			indexVertex += nbVertex;
			indexVertexUvs += nbVertexUvs;
			indexNormals += nbNormals;

		}

		const parseLine = ( line )=>{

			let nbVertex = 0;

			const geometry = line.geometry;
			const type = line.type;

			// shortcuts
			const vertices = geometry.getAttribute( 'position' );
            if (this.stream) {
                this.stream.write('o ' + line.name + '\n')
            }
			// name of the line object
			// output += 'o ' + line.name + '\n';

			if ( vertices !== undefined ) {

				for ( let i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

					vertex.fromBufferAttribute( vertices, i );

					// transform the vertex to world space
					vertex.applyMatrix4( line.matrixWorld );
                    if (this.stream) {
                        this.stream.write('v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n')
                    }
					// transform the vertex to export format
					//output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

				}

			}

			if ( type === 'Line' ) {
                if (this.stream) {
                    this.stream.write('l ')
                }

				// output += 'l ';

				for ( let j = 1, l = vertices.count; j <= l; j ++ ) {
                    if (this.stream) {
                        this.stream.write( ( indexVertex + j ) + ' ')
                    }
					//output += ( indexVertex + j ) + ' ';

				}
                if (this.stream) {
                    this.stream.write( '\n')
                }
				// output += '\n';

			}

			if ( type === 'LineSegments' ) {

				for ( let j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1 ) {
                    if (this.stream) {
                        this.stream.write( 'l ' + ( indexVertex + j ) + ' ' + ( indexVertex + k ) + '\n')
                    }
					// output += 'l ' + ( indexVertex + j ) + ' ' + ( indexVertex + k ) + '\n';

				}

			}

			// update index
			indexVertex += nbVertex;

		}

		const parsePoints = ( points )=> {

			let nbVertex = 0;

			const geometry = points.geometry;

			const vertices = geometry.getAttribute( 'position' );
			const colors = geometry.getAttribute( 'color' );

			output += 'o ' + points.name + '\n';

			if ( vertices !== undefined ) {

				for ( let i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

					vertex.fromBufferAttribute( vertices, i );
					vertex.applyMatrix4( points.matrixWorld );

					output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z;

					if ( colors !== undefined ) {

						color.fromBufferAttribute( colors, i ).convertLinearToSRGB();

						output += ' ' + color.r + ' ' + color.g + ' ' + color.b;

					}

					output += '\n';

				}

				output += 'p ';

				for ( let j = 1, l = vertices.count; j <= l; j ++ ) {

					output += ( indexVertex + j ) + ' ';

				}

				output += '\n';

			}

			// update index
			indexVertex += nbVertex;

		}

		object.traverse( function ( child ) {

			if ( child.isMesh === true ) {

				parseMesh( child );

			}

			if ( child.isLine === true ) {

				parseLine( child );

			}

			if ( child.isPoints === true ) {

				parsePoints( child );

			}

		} );
		// if (offset) {
		// 	this.stream.write(buffer.slice(0 , offset))
		// }
		const res = new Uint8Array(buffer)
		buffer = null
		return res

	}

}

export { OBJExporterNode };
